"""Village-scale cottage forms, separate from the player's 3m building modules."""
def author_village_meshes(Model,rng,palette,timber,stone):
    import math
    from mathutils import Vector
    rng.seed(43119);result=[]
    roof=Model('village_roof')
    def roofz(t,y):return 2.92*(1-t)**1.08-.12-.075*math.cos(y*.42)+.035*math.sin(y*4.1)*t*t
    # A continuous thick, bowed thatch mantle, not enlarged rectangular roof tiles.
    for side in (-1,1):
        vv=[];ff=[];nx=34;ny=68;start=len(roof.v)
        for i in range(nx+1):
            t=i/nx
            for j in range(ny+1):
                y=-3.4+j/ny*6.8;z=roofz(t,y)+.015*math.sin(j*2.4+i*.9)
                vv.append((side*t*3.62,y,z));roof.uv[start+len(vv)-1]=(y*.52,t*2.3)
        for i in range(nx):
            for j in range(ny):
                a=i*(ny+1)+j;face=(a,a+ny+1,a+ny+2,a+1);ff.append(face if side<0 else tuple(reversed(face)))
        roof.add(vv,ff,'thatch')
        for end in (-1,1):
            for i in range(nx):
                t0=i/nx;t1=(i+1)/nx;y=end*3.4;z0=roofz(t0,y);z1=roofz(t1,y)
                roof.add([(side*t0*3.62,y,z0),(side*t1*3.62,y,z1),(side*t1*3.62,y,z1-.24),(side*t0*3.62,y,z0-.24)],[(0,1,2,3)],'thatch')
            for i in range(4):
                t0=i/4;t1=(i+1)/4;timber(roof,(side*t0*3.5,end*3.28,roofz(t0,end*3.28)-.20),(side*t1*3.5,end*3.28,roofz(t1,end*3.28)-.20),.16,.18,'frame')
        # Hand-bound retention rods and straw tips vary along the long eave.
        for t in (.23,.55,.83):
            points=[(side*t*3.62,-3.43+j*.43,roofz(t,-3.43+j*.43)+.035) for j in range(17)]
            roof.tube(points,[.025]*17,'bark',sides=6,ridges=.1)
        for j in range(150):
            y=-3.39+j*.045;z=roofz(1,y)
            roof.tube([(side*3.51,y,z+.06),(side*(3.63+rng.random()*.06),y+.007,z-.12-rng.random()*.13)],[.018,.004],'thatch',sides=5,ridges=0)
    roof.tube([(0,-3.5,2.82),(0,0,2.78),(0,3.5,2.82)],[.11,.13,.11],'thatch',sides=14,ridges=.12)
    obj=roof.finish()
    for p in obj.data.polygons:p.use_smooth=True
    result.append(obj)

    g=Model('village_gable')
    for side in (-1,1):
        y=side*.055;g.add([(-3,y,0),(3,y,0),(0,y,2.66)],[(0,1,2)] if side<0 else [(2,1,0)],'plaster')
    for side in (-1,1):timber(g,(side*3,-.12,0),(0,-.12,2.72),.18,.19,'frame')
    for z,w in ((.08,3),(.82,2.05)):timber(g,(-w,-.13,z),(w,-.13,z),.18,.19,'frame')
    for x in (-1.38,1.38):timber(g,(x,-.11,.08),(x,-.11,1.46),.15,.16,'frame')
    for side in (-1,1):timber(g,(side*2.82,-.13,.10),(side*1.50,-.13,.80),.13,.16,'frame')
    # Inset shuttered loft window with a dark reveal, sill and structural header.
    g.add([(-.48,-.08,.85),(.48,-.08,.85),(.48,-.08,1.96),(-.48,-.08,1.96)],[(0,1,2,3)],'iron')
    for x in (-.52,.52):timber(g,(x,-.19,.80),(x,-.19,2.02),.13,.20,'frame')
    for z in (.81,2.02):timber(g,(-.61,-.19,z),(.61,-.19,z),.14,.23,'frame')
    for x in (-.32,-.16,0,.16,.32):timber(g,(x,-.14,.91),(x,-.14,1.94),.115,.055,'wood')
    result.append(g.finish())

    d=Model('village_details')
    # Masonry chimney rises above the ridge, with staggered blocks and a projecting cap.
    for row in range(23):
        z=.15+row*.30
        for side in (-1,1):
            for i in range(2):
                stone(d,(2.35+(i-.5)*.40, .65+side*.31,z),.38,.25,.28,900+row*9+i+int(side*3))
                stone(d,(2.35+side*.32,.65+(i-.5)*.39,z),.24,.38,.28,1800+row*9+i+int(side*3))
    stone(d,(2.35,.65,6.91),1.02,1.02,.20,937)
    # Entrance canopy: small, deliberately off-centre, with a usable stair opening.
    for x in (-2.65,-.35):
        timber(d,(x,-6.12,.05),(x,-6.12,2.39),.13,.15,'frame')
        timber(d,(x,-6.12,1.98),(x,-5.73,2.44),.09,.10,'frame')
    timber(d,(-2.81,-6.12,2.39),(-.19,-6.12,2.39),.16,.18,'frame')
    for i in range(22):
        x=-2.9+i*.13;z=2.82+.016*math.sin(i)
        d.beam((x,-4.43,z),(x,-6.36,2.38),.137,.15,'thatch')
    for i in range(3):stone(d,(-1.5,-4.76-i*.38,.36-i*.12),1.65,.46,.14,431+i)
    # Split firewood, end grain, chopping block, barrel and bench make the facade inhabited.
    for x in (.63,2.63):timber(d,(x,-5.13,.03),(x,-5.13,1.55),.11,.12,'frame')
    for row in range(4):
        for j in range(10-row):
            x=.80+j*.17+row*.08;z=.16+row*.145
            d.tube([(x,-4.68,z),(x,-5.46-rng.random()*.12,z)],[.084,.078],'bark',sides=9,caps='endgrain')
    for i in range(17):d.beam((.52+i*.135,-4.5,1.66),(.52+i*.135,-5.64,1.47),.13,.07,'wood')
    d.tube([(2.3,-6.0,.02),(2.3,-6.0,.62)],[.30,.25],'bark',sides=16,caps='endgrain')
    d.tube([(.45,-5.92,.02),(.45,-5.92,.44),(.45,-5.92,.83)],[.27,.32,.27],'wood',sides=18,caps='endgrain')
    for z in (.16,.67):d.tube([(.45,-5.92,z),(.45,-5.92,z+.045)],[.312,.312],'iron',sides=18)
    result.append(d.finish())
    return result
