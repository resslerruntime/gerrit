/**
 * @license
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import '../../shared/gr-js-api-interface/gr-js-api-interface';
import {GestureEventListeners} from '@polymer/polymer/lib/mixins/gesture-event-listeners';
import {LegacyElementMixin} from '@polymer/polymer/lib/legacy/legacy-element-mixin';
import {PolymerElement} from '@polymer/polymer/polymer-element';
import {htmlTemplate} from './gr-endpoint-decorator_html';
import {
  getPluginEndpoints,
  ModuleInfo,
} from '../../shared/gr-js-api-interface/gr-plugin-endpoints';
import {getPluginLoader} from '../../shared/gr-js-api-interface/gr-plugin-loader';
import {customElement, property} from '@polymer/decorators';
import {HookApi, PluginApi} from '../gr-plugin-types';

const INIT_PROPERTIES_TIMEOUT_MS = 10000;

@customElement('gr-endpoint-decorator')
class GrEndpointDecorator extends GestureEventListeners(
  LegacyElementMixin(PolymerElement)
) {
  static get template() {
    return htmlTemplate;
  }

  @property({type: String})
  name!: string;

  @property({type: Object})
  _domHooks = new Map<HTMLElement, HookApi>();

  @property({type: Object})
  _initializedPlugins = new Map<string, boolean>();

  /**
   * This is the callback that the plugin endpoint manager should be calling
   * when a new element is registered for this endpoint. It points to
   * _initModule().
   */
  _endpointCallBack: (info: ModuleInfo) => void = () => {};

  /** @override */
  detached() {
    super.detached();
    for (const [el, domHook] of this._domHooks) {
      domHook.handleInstanceDetached(el);
    }
    getPluginEndpoints().onDetachedEndpoint(this.name, this._endpointCallBack);
  }

  _initDecoration(
    name: string,
    plugin: PluginApi,
    slot?: string
  ): Promise<HTMLElement> {
    const el = document.createElement(name);
    return this._initProperties(
      el,
      plugin,
      this.getContentChildren().find(el => el.nodeName !== 'GR-ENDPOINT-PARAM')
    ).then(el => {
      const slotEl = slot
        ? this.querySelector(`gr-endpoint-slot[name=${slot}]`)
        : null;
      if (slot && slotEl?.parentNode) {
        slotEl.parentNode.insertBefore(el, slotEl.nextSibling);
      } else {
        this._appendChild(el);
      }
      return el;
    });
  }

  _initReplacement(name: string, plugin: PluginApi): Promise<HTMLElement> {
    this.getContentChildNodes()
      .filter(node => node.nodeName !== 'GR-ENDPOINT-PARAM')
      .forEach(node => (node as ChildNode).remove());
    const el = document.createElement(name);
    return this._initProperties(el, plugin).then((el: HTMLElement) =>
      this._appendChild(el)
    );
  }

  _getEndpointParams() {
    return Array.from(this.querySelectorAll('gr-endpoint-param'));
  }

  _initProperties(
    htmlEl: HTMLElement,
    plugin: PluginApi,
    content?: HTMLElement
  ) {
    const el = htmlEl as HTMLElement & {
      plugin?: PluginApi;
      content?: HTMLElement;
    };
    el.plugin = plugin;
    if (content) {
      el.content = content;
    }
    const expectProperties = this._getEndpointParams().map(paramEl => {
      const helper = plugin.attributeHelper(paramEl);
      // TODO: this should be replaced by accessing the property directly
      const paramName = paramEl.getAttribute('name');
      if (!paramName) throw Error('plugin endpoint parameter missing a name');
      return helper
        .get('value')
        .then(() =>
          helper.bind('value', value =>
            plugin.attributeHelper(el).set(paramName, value)
          )
        );
    });
    // TODO(TS): Should be a number, but TS thinks that is must be some weird
    // NodeJS.Timeout object.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timeoutId: any;
    const timeout = new Promise(
      () =>
        (timeoutId = setTimeout(() => {
          console.warn(
            'Timeout waiting for endpoint properties initialization: ' +
              `plugin ${plugin.getPluginName()}, endpoint ${this.name}`
          );
        }, INIT_PROPERTIES_TIMEOUT_MS))
    );
    return Promise.race([timeout, Promise.all(expectProperties)])
      .then(() => el)
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
  }

  _appendChild(el: HTMLElement): HTMLElement {
    if (!this.root) throw Error('plugin endpoint decorator missing root');
    return this.root.appendChild(el);
  }

  _initModule({moduleName, plugin, type, domHook, slot}: ModuleInfo) {
    const name = plugin.getPluginName() + '.' + moduleName;
    if (this._initializedPlugins.get(name)) {
      return;
    }
    let initPromise;
    switch (type) {
      case 'decorate':
        initPromise = this._initDecoration(moduleName, plugin, slot);
        break;
      case 'replace':
        initPromise = this._initReplacement(moduleName, plugin);
        break;
    }
    if (!initPromise) {
      throw Error(`unknown endpoint type ${type} used by plugin ${name}`);
    }
    this._initializedPlugins.set(name, true);
    initPromise.then(el => {
      if (domHook) {
        domHook.handleInstanceAttached(el);
        this._domHooks.set(el, domHook);
      }
    });
  }

  /** @override */
  ready() {
    super.ready();
    this._endpointCallBack = (info: ModuleInfo) => this._initModule(info);
    getPluginEndpoints().onNewEndpoint(this.name, this._endpointCallBack);
    if (this.name) {
      getPluginLoader()
        .awaitPluginsLoaded()
        .then(() => getPluginEndpoints().getAndImportPlugins(this.name))
        .then(() =>
          getPluginEndpoints()
            .getDetails(this.name)
            .forEach(this._initModule, this)
        );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gr-endpoint-decorator': GrEndpointDecorator;
  }
}
