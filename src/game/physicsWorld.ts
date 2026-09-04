import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PartData, PartShape } from '../types';
import { sounds } from './soundEngine';

export interface ExplosionEvent {
  position: [number, number, number];
  radius: number;
  force: number;
}

export class PhysicsWorld {
  public world: CANNON.World;
  public bodies: Map<string, CANNON.Body> = new Map();
  public characterBody: CANNON.Body;
  
  // Gravity Gun state
  public heldBodyId: string | null = null;
  public heldBodyDistance: number = 8;
  
  // Materials
  private defaultMaterial: CANNON.Material;
  private bouncyMaterial: CANNON.Material;
  private slickMaterial: CANNON.Material;
  private characterMaterial: CANNON.Material;

  constructor() {
    this.world = new CANNON.World();
    // Realistic Newtonian gravity in studs/sec^2
    this.world.gravity.set(0, -32, 0);
    this.world.allowSleep = true;
    (this.world.solver as any).iterations = 14;

    // Contact Materials
    this.defaultMaterial = new CANNON.Material('default');
    this.bouncyMaterial = new CANNON.Material('bouncy');
    this.slickMaterial = new CANNON.Material('slick');
    this.characterMaterial = new CANNON.Material('character');

    const defaultContact = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
      }
    );
    this.world.addContactMaterial(defaultContact);
    this.world.defaultContactMaterial = defaultContact;

    // Zero friction for character so it slides smoothly over parts and seams
    const charContact = new CANNON.ContactMaterial(
      this.characterMaterial,
      this.defaultMaterial,
      {
        friction: 0.0,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
      }
    );
    this.world.addContactMaterial(charContact);

    const bouncyContact = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.bouncyMaterial,
      {
        friction: 0.2,
        restitution: 1.5, // super bouncy trampoline
      }
    );
    this.world.addContactMaterial(bouncyContact);

    const slickContact = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.slickMaterial,
      {
        friction: 0.02,
        restitution: 0.05,
      }
    );
    this.world.addContactMaterial(slickContact);

    // Create Character Physics Body (Standard Box with 0.85 x 2.1 x 0.85 half-extents)
    // Perfectly matches the 4.2 stud Verlex avatar height
    const charShape = new CANNON.Box(new CANNON.Vec3(0.85, 2.1, 0.85));
    this.characterBody = new CANNON.Body({
      mass: 80, // kg / units
      material: this.characterMaterial,
      fixedRotation: true, // Do not let character tip over
      linearDamping: 0.02,
      allowSleep: false, // Character must NEVER sleep so movement commands always respond
    });
    this.characterBody.addShape(charShape);
    this.characterBody.position.set(0, 3.5, 0);
    this.world.addBody(this.characterBody);
  }

  public setZeroGravity(zeroG: boolean) {
    this.world.gravity.set(0, zeroG ? 0 : -32, 0);
  }

  /**
   * Adds or updates a Part in the Cannon-es physics simulation
   */
  public syncPartBody(part: PartData): CANNON.Body {
    if (this.bodies.has(part.id)) {
      this.removePartBody(part.id);
    }

    const [sx, sy, sz] = part.size;
    let shape: CANNON.Shape;

    switch (part.shape) {
      case 'sphere':
        shape = new CANNON.Sphere(sx / 2);
        break;
      case 'cylinder':
        // Cylinder in Cannon is oriented along Z by default, we want Y
        shape = new CANNON.Cylinder(sx / 2, sx / 2, sy, 12);
        break;
      case 'wedge': {
        // Approximate wedge as custom polyhedral convex shape
        const hx = sx / 2;
        const hy = sy / 2;
        const hz = sz / 2;
        const vertices = [
          new CANNON.Vec3(-hx, -hy, -hz),
          new CANNON.Vec3(hx, -hy, -hz),
          new CANNON.Vec3(hx, -hy, hz),
          new CANNON.Vec3(-hx, -hy, hz),
          new CANNON.Vec3(-hx, hy, hz),
          new CANNON.Vec3(hx, hy, hz),
        ];
        const faces = [
          [0, 1, 2, 3], // bottom
          [2, 5, 4, 3], // back
          [0, 4, 5, 1], // ramp
          [0, 3, 4],    // left
          [1, 5, 2],    // right
        ];
        shape = new CANNON.ConvexPolyhedron({ vertices, faces });
        break;
      }
      case 'block':
      case 'spawn':
      case 'trampoline':
      case 'conveyor':
      case 'tnt':
      case 'truss':
      case 'dummy':
      default:
        shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
        break;
    }

    // Determine mass based on volume and anchored status
    // Density ~ 0.5 kg per cubic stud
    const volume = sx * sy * sz;
    const calculatedMass = part.anchored ? 0 : Math.max(0.5, volume * 0.5);

    let mat = this.defaultMaterial;
    if (part.shape === 'trampoline') {
      mat = this.bouncyMaterial;
    } else if (part.material === 'ice') {
      mat = this.slickMaterial;
    }

    const body = new CANNON.Body({
      mass: calculatedMass,
      type: part.anchored ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC,
      material: mat,
      linearDamping: 0.1,
      angularDamping: 0.2,
    });

    body.addShape(shape);
    body.position.set(part.position[0], part.position[1], part.position[2]);

    const euler = new THREE.Euler(part.rotation[0], part.rotation[1], part.rotation[2]);
    const quat = new THREE.Quaternion().setFromEuler(euler);
    body.quaternion.set(quat.x, quat.y, quat.z, quat.w);

    (body as any).userData = { partId: part.id, partData: part };

    this.world.addBody(body);
    this.bodies.set(part.id, body);

    return body;
  }

  public removePartBody(partId: string) {
    const body = this.bodies.get(partId);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(partId);
    }
    if (this.heldBodyId === partId) {
      this.heldBodyId = null;
    }
  }

  /**
   * Applies an explosion at a position in world space
   */
  public applyExplosion(pos: [number, number, number], radius: number = 18, maxForce: number = 850) {
    const epicCenter = new CANNON.Vec3(pos[0], pos[1], pos[2]);
    sounds.playExplosion();

    this.bodies.forEach((body) => {
      if (body.type !== CANNON.Body.DYNAMIC) return;

      const dist = body.position.distanceTo(epicCenter);
      if (dist < radius) {
        // Vector from explosion center to body center
        const dir = body.position.vsub(epicCenter);
        // Add slight upward blast bias for Verlex explosion lift
        dir.y += 1.5;
        dir.normalize();

        const falloff = 1 - dist / radius;
        const impulseMagnitude = maxForce * falloff;
        const impulse = dir.scale(impulseMagnitude);

        body.applyImpulse(impulse, body.position);
        body.wakeUp();
      }
    });

    // Also blast the character if in range
    const charDist = this.characterBody.position.distanceTo(epicCenter);
    if (charDist < radius) {
      const charDir = this.characterBody.position.vsub(epicCenter);
      charDir.y += 2.0;
      charDir.normalize();
      const charImpulse = charDir.scale(maxForce * (1 - charDist / radius) * 0.9);
      this.characterBody.applyImpulse(charImpulse, this.characterBody.position);
    }
  }

  /**
   * Applies an impulse force to a specific body (e.g. from Push Tool, Sword, or Rocket hit)
   */
  public applyBodyImpulse(partId: string, impulseVec: [number, number, number]) {
    const body = this.bodies.get(partId);
    if (body && body.type === CANNON.Body.DYNAMIC) {
      const imp = new CANNON.Vec3(impulseVec[0], impulseVec[1], impulseVec[2]);
      body.applyImpulse(imp, body.position);
      body.wakeUp();
    }
  }

  /**
   * Grab or release an unanchored physics part with the Gravity Gun
   */
  public toggleGrabBody(partId: string | null, targetDistance: number = 8) {
    if (!partId) {
      this.heldBodyId = null;
      sounds.setGravityBeam(false);
      return;
    }

    const body = this.bodies.get(partId);
    if (body && body.type === CANNON.Body.DYNAMIC) {
      this.heldBodyId = partId;
      this.heldBodyDistance = targetDistance;
      body.wakeUp();
      sounds.setGravityBeam(true);
    }
  }

  /**
   * Throws the currently held body with high velocity in the aim direction
   */
  public throwHeldBody(aimDir: THREE.Vector3, throwStrength: number = 65) {
    if (!this.heldBodyId) return;

    const body = this.bodies.get(this.heldBodyId);
    if (body) {
      const impulse = new CANNON.Vec3(
        aimDir.x * throwStrength,
        aimDir.y * throwStrength + 8,
        aimDir.z * throwStrength
      );
      body.applyImpulse(impulse, body.position);
      body.wakeUp();
      sounds.playPhysicsThud(0.8);
    }

    this.heldBodyId = null;
    sounds.setGravityBeam(false);
  }

  /**
   * Updates Newtonian physics step and updates held object spring-damper joint
   */
  public step(deltaTime: number, cameraPos?: THREE.Vector3, cameraDir?: THREE.Vector3) {
    const clampedDelta = Math.min(deltaTime, 0.05);
    this.world.step(1 / 60, clampedDelta, 3);

    // Update Gravity Gun held body if active
    if (this.heldBodyId && cameraPos && cameraDir) {
      const body = this.bodies.get(this.heldBodyId);
      if (body) {
        // Calculate target position in front of player
        const targetX = cameraPos.x + cameraDir.x * this.heldBodyDistance;
        const targetY = cameraPos.y + cameraDir.y * this.heldBodyDistance;
        const targetZ = cameraPos.z + cameraDir.z * this.heldBodyDistance;

        const targetPos = new CANNON.Vec3(targetX, targetY, targetZ);
        const distVec = targetPos.vsub(body.position);

        // Spring-damper force pulling body to crosshair
        const springStrength = 40;
        const damping = 8;
        const force = distVec.scale(springStrength * body.mass).vsub(body.velocity.scale(damping * body.mass));

        body.applyForce(force, body.position);
        body.angularVelocity.scale(0.9, body.angularVelocity);
        body.wakeUp();
      }
    }
  }
}
