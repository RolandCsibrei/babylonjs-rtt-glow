import { ShaderStore } from '@babylonjs/core'

let name = 'morphTargetsVertexDeclaration'
let shader = `#ifdef MORPHTARGETS
#ifndef MORPHTARGETS_TEXTURE
attribute vec3 position{X};
#ifdef MORPHTARGETS_NORMAL
attribute vec3 normal{X};
#endif
#ifdef MORPHTARGETS_TANGENT
attribute vec3 tangent{X};
#endif
#ifdef MORPHTARGETS_UV
attribute vec2 uv_{X};
#endif
#endif
#endif`

ShaderStore.IncludesShadersStore[name] = shader
/** @hidden */
export var morphTargetsVertexDeclaration = { name, shader }
