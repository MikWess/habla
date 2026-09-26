"""Lucía v2: original clay-toy character and Blender-rendered expression loops."""
import bpy, math
from mathutils import Vector
from PIL import Image
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public'/'character';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,rough=.7):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=rough
 return m
skin=mat('Caramel clay',(.60,.32,.18));hair=mat('Chocolate curls',(.074,.031,.024));shirt=mat('Sunshine knit',(.98,.62,.085));pants=mat('Lagoon blue dungarees',(.065,.40,.43));shoe=mat('Papaya trainers',(.91,.19,.11));cream=mat('Vanilla',(.98,.91,.72));white=mat('Warm white',(.99,.97,.88));ink=mat('Espresso',(.055,.022,.017));cheek=mat('Peach cheeks',(.83,.26,.17));gold=mat('Butter gold',(.98,.64,.1),.38);inside=mat('Open smile',(.23,.035,.025));island=mat('Pistachio',(.70,.77,.43));sole=mat('Trainer sole',(.94,.83,.62))
def sphere(name,loc,scale,ma,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(ma)
 for p in o.data.polygons:p.use_smooth=True
 if parent:o.parent=parent
 return o
def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc
 if parent:o.parent=parent
 return o
def curve(name,pts,r,ma,parent=None):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=5;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(ma)
 if parent:o.parent=parent
 return o
root=empty('Body rig');head=empty('Expressive head',(0,0,2.36),root)
# A continuous bob and a soft asymmetric fringe, with fewer separate lumps.
sphere('Bob silhouette',(0,.10,.04),(.82,.56,.81),hair,head)
sphere('Round face',(0,-.12,-.005),(.735,.54,.68),skin,head)
sphere('Hair crown',(0,.04,.55),(.72,.49,.31),hair,head)
lock=sphere('Swept fringe',(-.30,-.43,.45),(.48,.18,.24),hair,head);lock.rotation_euler[1]=-.40
lock=sphere('Fringe tip',(-.60,-.30,.25),(.19,.22,.34),hair,head);lock.rotation_euler[1]=-.16
sphere('Right face framing curl',(.66,-.01,.14),(.16,.27,.45),hair,head)
sphere('Pony puff',(.70,.32,.04),(.30,.28,.45),hair,head)
sphere('Coral scrunchie',(.71,.25,.34),(.22,.20,.11),shoe,head)
eyes=[];brows=[];happyEyes=[]
for x in [-.265,.265]:
 sphere('Ear',(x*2.77,-.045,-.08),(.12,.12,.17),skin,head)
 e=sphere('Eye white',(x,-.620,.055),(.104,.037,.132),white,head);eyes.append((e,.132))
 e=sphere('Pupil',(x+.014,-.657,.051),(.062,.020,.088),ink,head);eyes.append((e,.088))
 e=sphere('Eye glint',(x-.004,-.677,.085),(.019,.012,.023),white,head);eyes.append((e,.023))
 happyEyes.append(curve('Laughing eye',[(x-.09,-.63,.03),(x,-.668,.083),(x+.09,-.63,.03)],.025,ink,head))
 brows.append(curve('Friendly eyebrow',[(x-.1,-.574,.235),(x,-.622,.255),(x+.09,-.583,.23)],.031,hair,head))
 sphere('Peach blush',(x*1.53,-.57,-.19),(.113,.018,.062),cheek,head)
 bpy.ops.mesh.primitive_torus_add(major_radius=.092,minor_radius=.024,major_segments=36,minor_segments=12,location=(x*2.8,-.08,-.26),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name='Little gold hoop';o.parent=head;o.data.materials.append(gold)
sphere('Button nose',(0,-.702,-.082),(.083,.096,.08),skin,head)
smile=curve('Smile',[(-.175,-.591,-.24),(0,-.664,-.315),(.175,-.591,-.24)],.031,ink,head)
mouth=sphere('Talking mouth',(0,-.635,-.285),(.13,.038,.062),inside,head)
teeth=sphere('Happy teeth',(0,-.675,-.244),(.12,.016,.026),white,head)
sphere('Neck',(0,0,1.82),(.18,.18,.23),skin,root)
sphere('Sweater',(0,0,1.34),(.49,.33,.49),shirt,root)
# Rounded overall bib, straps, buttons, and stitched front pocket.
sphere('Dungaree body',(0,-.01,1.10),(.46,.34,.34),pants,root)
sphere('Overall bib',(0,-.29,1.41),(.31,.063,.25),pants,root)
for x in [-.255,.255]:
 curve('Overall strap',[(x,-.19,1.72),(x,-.28,1.58),(x,-.348,1.45)],.047,pants,root)
 sphere('Copper button',(x,-.40,1.49),(.034,.015,.034),gold,root)
curve('Pocket stitch',[(-.11,-.366,1.37),(-.08,-.377,1.27),(0,-.38,1.24),(.08,-.377,1.27),(.11,-.366,1.37)],.009,cream,root)
# Small daisy pin as a recognizable character detail.
for a in range(5):
 angle=2*math.pi*a/5;sphere('Daisy petal',(.15+.042*math.cos(angle),-.37,1.61+.042*math.sin(angle)),(.027,.014,.027),cream,root)
sphere('Daisy middle',(.15,-.39,1.61),(.026,.014,.026),shoe,root)
for x in [-.24,.24]:
 sphere('Short trouser leg',(x,.01,.62),(.20,.23,.4),pants,root)
 sphere('Rolled cuff',(x,0,.38),(.214,.238,.072),pants,root)
 sphere('Papaya trainer',(x,-.13,.205),(.255,.38,.17),shoe,root)
 sphere('Vanilla sole',(x,-.135,.098),(.26,.38,.065),sole,root)
 sphere('Toe cap',(x,-.358,.209),(.231,.19,.12),cream,root)
 for y in [-.30,-.23]:curve('Cream laces',[(x-.105,y,.34),(x+.105,y,.34)],.014,cream,root)
left=empty('Left shoulder',(-.40,0,1.61),root);right=empty('Right shoulder',(.40,0,1.61),root)
for arm,side in [(left,-1),(right,1)]:
 sphere('Puffy sleeve',(side*.16,0,-.12),(.19,.21,.29),shirt,arm)
 sphere('Forearm',(side*.23,-.015,-.38),(.13,.14,.21),skin,arm)
 sphere('Soft hand',(side*.245,-.035,-.55),(.16,.135,.17),skin,arm)
 sphere('Thumb',(side*.12,-.11,-.51),(.065,.065,.095),skin,arm)
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=1.1,depth=.09,location=(0,0,-.012));o=bpy.context.object;o.name='Soft round island';o.scale.y=.83;o.data.materials.append(island);b=o.modifiers.new('Soft bevel','BEVEL');b.width=.06;b.segments=4
for p in o.data.polygons:p.use_smooth=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=640;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.world.color=(.8,.8,.8);scene.view_settings.view_transform='AgX'
def area(name,loc,power,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
area('Soft daylight',(-3,-4,7),550,5);area('Face bounce',(3,-4,3),260,4);area('Warm rim',(0,3,6),450,3)
bpy.ops.object.camera_add(location=(.18,-9,3.55));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.70))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.9;scene.camera=cam
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.fps=12;scene.frame_end=12
for f in range(1,13):
 a=2*math.pi*(f-1)/12;root.location.z=.025*math.sin(a);root.keyframe_insert(data_path='location',frame=f);head.rotation_euler[1]=.055*math.sin(a);head.keyframe_insert(data_path='rotation_euler',frame=f)
for e in happyEyes:e.hide_render=True
mouth.hide_render=True;teeth.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'lucia.blend'))
framesdir=ROOT/'.local'/'renders-v2';framesdir.mkdir(parents=True,exist_ok=True)
for state in ['idle','talk','happy','thinking']:
 frames=[]
 for i in range(12):
  a=2*math.pi*i/12;scene.frame_set(1);root.location.z=.024*math.sin(a);root.rotation_euler[2]=.025*math.sin(a);head.rotation_euler=(.015*math.sin(a),.055*math.sin(a),0)
  left.rotation_euler=(0,.10+.045*math.sin(a),0);right.rotation_euler=(0,-.10-.045*math.sin(a),0)
  smile.hide_render=False;mouth.hide_render=True;teeth.hide_render=True
  for eye,sz in eyes:eye.hide_render=False;eye.scale.z=sz*(.13 if i==9 else 1)
  for e in happyEyes:e.hide_render=True
  if state=='talk':
   smile.hide_render=True;mouth.hide_render=False;mouth.scale=(.12+.02*math.sin(a*3),.038,.045+.06*(.5+.5*math.sin(a*3)));teeth.hide_render=False;right.rotation_euler[1]=-.30-.1*math.sin(a);head.rotation_euler[1]=-.06+.04*math.sin(a)
  if state=='happy':
   root.location.z=.065+.06*math.sin(a);head.rotation_euler[1]=-.11;right.rotation_euler[1]=-2.27+.23*math.sin(a*2);left.rotation_euler[1]=.35
   smile.hide_render=True;mouth.hide_render=False;mouth.scale=(.17,.045,.10);teeth.hide_render=False
   for eye,sz in eyes:eye.hide_render=True
   for e in happyEyes:e.hide_render=False
  if state=='thinking':
   head.rotation_euler[1]=.17+.02*math.sin(a);right.rotation_euler[0]=-.65;right.rotation_euler[1]=-1.80
  scene.render.filepath=str(framesdir/f'{state}-{i}.png');bpy.ops.render.render(write_still=True);frames.append(Image.open(scene.render.filepath).convert('RGBA'))
  if state=='idle' and i==0:frames[0].save(OUT/'lucia.png')
 frames[0].save(OUT/f'{state}.webp',save_all=True,append_images=frames[1:],duration=120 if state=='talk' else 180,loop=0,quality=86,method=4)
print('Lucía v2 rendered.')
