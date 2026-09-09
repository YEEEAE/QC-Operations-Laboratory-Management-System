from pathlib import Path
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix, translation_matrix

ROOT = Path('/mnt/data/qc-login-3d-background')
ASSET = ROOT/'assets'/'qc-medical-hero.glb'
SRC = ROOT/'source'/'generate_qc_medical_hero.py'
SRC.parent.mkdir(parents=True, exist_ok=True)


def T(x=0,y=0,z=0):
    return translation_matrix([x,y,z])

def R(angle, axis):
    return rotation_matrix(angle, axis)

def add(scene, mesh, name, transform=None, parent='HeroRoot'):
    try:
        mesh.update_faces(mesh.unique_faces())
    except Exception:
        pass
    mesh.remove_unreferenced_vertices()
    mesh.merge_vertices()
    mesh.fix_normals()
    scene.add_geometry(mesh, node_name=name, geom_name=name+'Geometry', parent_node_name=parent, transform=transform)


def torus(major, minor, major_sections=128, minor_sections=32):
    return trimesh.creation.torus(major_radius=major, minor_radius=minor, major_sections=major_sections, minor_sections=minor_sections)


def cyl(radius, height, sections=128):
    return trimesh.creation.cylinder(radius=radius, height=height, sections=sections)


def radial_cylinder(length, radius, angle, z, sections=32):
    # Cylinder starts along local Z; rotate into XY plane then around Z.
    m = trimesh.creation.cylinder(radius=radius, height=length, sections=sections)
    base = R(np.pi/2, [0,1,0])
    rot = R(angle, [0,0,1])
    # Position center at half length outward from center
    pos = T(np.cos(angle)*length*0.50, np.sin(angle)*length*0.50, z)
    return m, pos @ rot @ base

scene = trimesh.Scene()
scene.graph.update(frame_to='HeroRoot', frame_from='world', matrix=np.eye(4))

# Primary low-profile transparent housing puck.
add(scene, cyl(1.47, 0.50, 160), 'OuterHousing', T(0,0,0.00))
# Front/rear softened rims create manufactured wall thickness and highlight catches.
add(scene, torus(1.25, 0.22, 160, 40), 'OuterHousingFrontRim', T(0,0,0.22))
add(scene, torus(1.25, 0.20, 160, 40), 'OuterHousingRearRim', T(0,0,-0.22))

# Internal structural support: small ring + six radial rounded struts.
add(scene, torus(0.74, 0.10, 128, 28), 'StructuralInsertRing', T(0,0,-0.06))
for i in range(6):
    ang = i*np.pi/3 + np.pi/6
    m, xf = radial_cylinder(0.70, 0.055, ang, -0.06, 28)
    add(scene, m, f'StructuralInsertSpoke_{i+1}', xf)

# Membrane and retaining/sealing elements slightly separated but mechanically plausible.
add(scene, cyl(1.055, 0.055, 192), 'Membrane', T(0,0,0.105))
add(scene, torus(1.18, 0.065, 160, 32), 'RetainingRing', T(0,0,0.295))
add(scene, torus(1.06, 0.055, 144, 28), 'Seal', T(0,0,-0.305))

# Two opposed radial flow connectors integrated into the housing.
# Rotate cylinders from Z axis to X axis.
rx = R(np.pi/2, [0,1,0])
add(scene, cyl(0.26, 0.72, 96), 'ConnectorInBody', T(-1.72,0,0) @ rx)
add(scene, torus(0.27, 0.055, 96, 24), 'ConnectorInCollar', T(-1.42,0,0) @ R(np.pi/2,[0,1,0]))
add(scene, cyl(0.22, 0.62, 96), 'ConnectorOutBody', T(1.67,0,0) @ rx)
add(scene, torus(0.23, 0.05, 96, 24), 'ConnectorOutCollar', T(1.42,0,0) @ R(np.pi/2,[0,1,0]))

# Small asymmetric alignment key to avoid generic perfect symmetry.
key = trimesh.creation.capsule(radius=0.08, height=0.32, count=[24,24])
add(scene, key, 'AlignmentKey', T(0.78,-0.78,0.30) @ R(np.pi/2,[1,0,0]))

# Metadata describing intent without asserting clinical certification.
scene.metadata['asset_name'] = 'QC Medical Membrane Inspection Module'
scene.metadata['purpose'] = 'Abstract medical-manufacturing quality-control visualization asset'
scene.metadata['generator'] = 'Programmatic trimesh GLB generator'

# Export GLB.
blob = scene.export(file_type='glb')
ASSET.parent.mkdir(parents=True, exist_ok=True)
ASSET.write_bytes(blob)

# Save editable source alongside deliverable.
source_text = Path(__file__).read_text()
SRC.write_text(source_text, encoding='utf-8')

triangles = sum(len(g.faces) for g in scene.geometry.values() if hasattr(g, 'faces'))
print(f'Wrote {ASSET} ({ASSET.stat().st_size/1024:.1f} KiB), triangles={triangles}, geometries={len(scene.geometry)}')
