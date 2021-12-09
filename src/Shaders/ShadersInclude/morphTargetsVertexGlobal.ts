import { ShaderStore } from '@babylonjs/core'

let name = 'morphTargetsVertexGlobal'
let shader = `#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
float vertexID;
#endif
#endif`

ShaderStore.IncludesShadersStore[name] = shader
/** @hidden */
export var morphTargetsVertexGlobal = { name, shader }
