"""Original toy character, created and rendered in Blender. Run with bpy >= 4.5.
Outputs transparent animated WebP states and an editable .blend file.
"""
import bpy, math, os
from mathutils import Vector
from PIL import Image
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'character'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, color, rough=.5):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=rough
    return m
skin=mat('Warm terracotta skin',(.57,.29,.16)); hair=mat('Espresso hair',(.043,.019,.014)); coral=mat('Paprika knit',(.88,.19,.105)); teal=mat('Deep teal trousers',(.075,.25,.24)); cream=mat('Cream sneakers',(.94,.86,.69)); dark=mat('Eyes and smile',(.045,.022,.02)); blush=mat('Rosy cheeks',(.7,.23,.16)); gold=mat('Small gold hoops',(.95,.59,.12),.25); white=mat('Eye glints',(.98,.98,.93)); sole=mat('Shoe sole',(.7,.63,.5)); mint=mat('Mint plinth',(.52,.68,.46)); mouthmat=mat('Mouth interior',(.19,.035,.028))
def sphere(name,loc,scale,material,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(material)
    for p in o.data.polygons:p.use_smooth=True
    if parent:o.parent=parent
    return o
def empty(name,loc):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o);o.location=loc;return o
def curve(name,pts,r,material,parent=None):
    c=bpy.data.curves.new(name,'CURVE'); c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=4
    s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
    for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    if parent:o.parent=parent
    return o
root=empty('Lucia body rig',(0,0,0))
head=empty('Head pivot',(0,0,2.5));head.parent=root
sphere('Hair silhouette',(0,.085,.06),(.71,.57,.79),hair,head)
sphere('Face',(0,-.10,-.01),(.62,.51,.68),skin,head)
# Side-swept sculpted locks frame the face.
for x,y,z,sx,sz in [(-.42,-.26,.47,.32,.38),(-.13,-.39,.61,.30,.23),(.18,-.38,.62,.29,.20),(.44,-.27,.49,.23,.32),(-.57,-.01,-.05,.16,.54),(.57,.015,-.04,.16,.5)]:
    o=sphere('Sculpted hair lock',(x,y,z),(sx,.22,sz),hair,head);o.rotation_euler[1]=-.22
sphere('Ponytail',(.48,.43,-.03),(.29,.29,.64),hair,head)
sphere('Hair tie',(.52,.39,.34),(.22,.19,.10),coral,head)
for x in [-.25,.25]:
    sphere('Ear',(x*2.45,-.04,-.1),(.12,.13,.19),skin,head)
    sphere('Eye',(x,-.57,.045),(.065,.031,.095),dark,head)
    sphere('Eye sparkle',(x-.017,-.599,.075),(.016,.012,.022),white,head)
    curve('Eyebrow',[(x-.083,-.557,.20),(x,-.581,.23),(x+.078,-.557,.211)],.023,hair,head)
    sphere('Cheek',(x*1.4,-.508,-.14),(.087,.025,.042),blush,head)
    bpy.ops.mesh.primitive_torus_add(major_radius=.087,minor_radius=.018,major_segments=32,minor_segments=10,location=(x*2.5,-.09,-.27),rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.name='Gold hoop';o.data.materials.append(gold);o.parent=head
sphere('Button nose',(0,-.61,-.09),(.077,.083,.085),skin,head)
smile=curve('Smile',[(-.15,-.566,-.24),(0,-.606,-.30),(.15,-.566,-.24)],.025,dark,head)
mouth=sphere('Talking mouth',(0,-.59,-.267),(.105,.035,.018),mouthmat,head)
sphere('Neck',(0,0,1.92),(.18,.17,.29),skin,root)
sphere('Sweater',(0,0,1.47),(.46,.31,.56),coral,root)
sphere('Ribbed hem',(0,0,1.04),(.42,.3,.075),coral,root)
curve('Collar',[(-.19,-.22,1.88),(0,-.30,1.83),(.19,-.22,1.88)],.032,cream,root)
for x in [-.22,.22]:
    sphere('Trouser leg',(x,0,.65),(.19,.23,.48),teal,root)
    sphere('Sneaker',(x,-.12,.20),(.215,.36,.16),cream,root)
    sphere('Sole',(x,-.125,.105),(.22,.36,.06),sole,root)
    for z in [0,.06]:curve('Laces',[(x-.09,-.39+z,.27),(x+.09,-.39+z,.27)],.013,white,root)
left=empty('Left shoulder',(-.39,0,1.71));left.parent=root
right=empty('Right shoulder',(.39,0,1.71));right.parent=root
for arm,side in [(left,-1),(right,1)]:
    sphere('Sleeve',(side*.13,0,-.21),(.18,.22,.34),coral,arm)
    sphere('Forearm',(side*.22,-.035,-.51),(.12,.13,.25),skin,arm)
    sphere('Mitten hand',(side*.25,-.06,-.7),(.15,.11,.17),skin,arm)
    sphere('Thumb',(side*.13,-.12,-.66),(.07,.06,.10),skin,arm)
# A soft little island beneath the character.
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=1.13,depth=.13,location=(0,0,-.01))
plinth=bpy.context.object;plinth.name='Little conversation island';plinth.data.materials.append(mint)
bev=plinth.modifiers.new('Rounded edge','BEVEL');bev.width=.08;bev.segments=4
for p in plinth.data.polygons:p.use_smooth=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=600;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.world.color=(.65,.65,.65)
scene.view_settings.view_transform='AgX'
def area(name,loc,power,size):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-3,-4,7),500,5);area('Warm fill',(4,-2,4),300,4);area('Hair rim',(1,3,6),450,3)
bpy.ops.object.camera_add(location=(0,-8,4.0));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.65))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.0;scene.camera=cam
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
# Save the actual model, lighting and keyed expressions for editing in Blender.
for f in range(1,25):
    a=2*math.pi*(f-1)/24
    root.location.z=.035*math.sin(a);root.keyframe_insert(data_path='location',frame=f)
    head.rotation_euler[1]=.05*math.sin(a);head.keyframe_insert(data_path='rotation_euler',frame=f)
scene.frame_end=24;scene.render.fps=12
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'lucia.blend'))
framesdir=ROOT/'.local'/'renders';framesdir.mkdir(parents=True,exist_ok=True)
for state in ['idle','talk','happy','thinking']:
    frames=[]
    for i in range(6):
        a=2*math.pi*i/6;scene.frame_set(1)
        root.location.z=.025*math.sin(a);head.rotation_euler=(0,.035*math.sin(a),.018*math.sin(a))
        right.rotation_euler=(0,0,0);left.rotation_euler=(0,0,0);mouth.scale.z=.018
        if state=='talk':mouth.scale.z=.035+.055*(.5+.5*math.sin(a*2));head.rotation_euler[1]=.05*math.sin(a);right.rotation_euler[1]=-.18
        if state=='happy':
            root.location.z=.07+.065*math.sin(a);right.rotation_euler[1]=-2.2+.18*math.sin(a);left.rotation_euler[1]=.25;head.rotation_euler[1]=-.09;mouth.scale.z=.065
        if state=='thinking':head.rotation_euler[1]=.13;right.rotation_euler[0]=-.6;right.rotation_euler[1]=-1.5;mouth.scale.z=.015
        scene.render.filepath=str(framesdir/f'{state}-{i}.png');bpy.ops.render.render(write_still=True)
        frames.append(Image.open(scene.render.filepath).convert('RGBA'))
        if state=='idle' and i==0:frames[0].save(OUT/'lucia.png')
    frames[0].save(OUT/f'{state}.webp',save_all=True,append_images=frames[1:],duration=140 if state=='talk' else 220,loop=0,quality=88,method=6)
print('Rendered Lucía: idle, talk, happy, thinking')
