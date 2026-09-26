"""Original small scene props, rendered with Blender Cycles."""
import bpy, math
from mathutils import Vector
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'public'/'character'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=.65;return m
coral=material('Coral',(.8,.23,.14));cream=material('Paper',(.91,.85,.66));sage=material('Sage',(.29,.44,.28));dark=material('Ink',(.17,.25,.20));wood=material('Maple',(.58,.36,.18));blue=material('Picture background',(.56,.7,.67));skin=material('Clay',(.6,.34,.2))
def box(name,loc,scale,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);b=o.modifiers.new('Soft edges','BEVEL');b.width=.055;b.segments=5;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.render.resolution_x=256;scene.render.resolution_y=256;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.world.color=(.65,.65,.65)
bpy.ops.object.camera_add(location=(3,-6,4));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.3;scene.camera=cam
for loc,p in [((-3,-4,5),350),((3,2,5),250)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=p;l.data.size=4;l.rotation_euler=(Vector((0,0,.3))-l.location).to_track_quat('-Z','Y').to_euler()
for z,ma,rot in [(.17,sage,-.12),(.45,coral,.09)]:
 cover=box('Book cover',(0,0,z),(1.25,.85,.28),ma);cover.rotation_euler[2]=rot
 pages=box('Page block',(.04,-.03,z+.01),(1.14,.80,.18),cream);pages.rotation_euler[2]=rot
for i in range(3):box('Title line',(-.04,-.07+i*.11,.60),(.6,.035,.014),cream)
scene.render.filepath=str(OUT/'books.png');bpy.ops.render.render(write_still=True)
for o in list(bpy.data.objects):
 if o.type=='MESH':bpy.data.objects.remove(o,do_unlink=True)
box('Picture frame',(0,0,.6),(1.15,.14,1.25),wood);box('Picture',(0,-.083,.63),(.98,.045,1.08),blue)
for x,z,sz,ma in [(-.25,.69,.15,sage),(.22,.73,.15,coral),(0,.43,.11,cream)]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=(x,-.15,z));o=bpy.context.object;o.scale=(sz,.025,sz);o.data.materials.append(skin)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=(x,-.15,z-.23));o=bpy.context.object;o.scale=(sz*1.1,.03,sz*1.4);o.data.materials.append(ma)
scene.render.filepath=str(OUT/'family.png');bpy.ops.render.render(write_still=True)
