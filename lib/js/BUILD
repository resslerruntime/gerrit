load("//tools/bzl:js.bzl", "js_component")

package(default_visibility = ["//visibility:public"])

js_component(
    name = "highlightjs",
    srcs = ["//lib/highlightjs:highlight.min.js"],
    license = "//lib:LICENSE-highlightjs",
)

# TODO(dmfilippov) - rename to "highlightjs" after removing js_component
# license-map.py uses rule name to extract package name; everything after
# double underscore are removed.
filegroup(
    name = "highlightjs__files",
    srcs = ["//lib/highlightjs:highlight.min.js"],
    data = ["//lib:LICENSE-highlightjs"],
)
