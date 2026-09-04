import * as THREE from 'three';
import { PartMaterial, SurfaceType } from '../types';

class TextureFactory {
  private studTextureCache: Map<string, THREE.CanvasTexture> = new Map();
  private decalCache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Generates the iconic Verlex Studs top surface texture
   */
  public getStudTexture(surfaceType: SurfaceType = 'studs'): THREE.CanvasTexture {
    const key = `surface_${surfaceType}`;
    if (this.studTextureCache.has(key)) {
      return this.studTextureCache.get(key)!;
    }

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base background neutral white/grey
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    if (surfaceType === 'studs') {
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.32;

      // Outer drop shadow for stud 3D effect
      const shadowGrad = ctx.createRadialGradient(
        centerX, centerY, radius * 0.7,
        centerX, centerY, radius * 1.15
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Stud top rim highlight (light from top-left)
      const rimGrad = ctx.createLinearGradient(
        centerX - radius, centerY - radius,
        centerX + radius, centerY + radius
      );
      rimGrad.addColorStop(0, '#ffffff');
      rimGrad.addColorStop(0.5, '#e0e0e0');
      rimGrad.addColorStop(1, '#9e9e9e');

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner bevel / circular stud top
      ctx.strokeStyle = '#b0b0b0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // Iconic "VERLEX" / Verlex ring
      ctx.fillStyle = '#8a8a8a';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VERLEX', centerX, centerY);
    } else if (surfaceType === 'inlets') {
      // Inverted circular hole / inlet
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.3;

      const innerGrad = ctx.createRadialGradient(
        centerX - 4, centerY - 4, radius * 0.2,
        centerX, centerY, radius
      );
      innerGrad.addColorStop(0, '#666666');
      innerGrad.addColorStop(0.7, '#333333');
      innerGrad.addColorStop(1, '#888888');

      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight on bottom-right of hole
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else if (surfaceType === 'weld') {
      // Cross weld markings
      ctx.strokeStyle = '#777777';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.lineTo(size - 10, size - 10);
      ctx.moveTo(size - 10, 10);
      ctx.lineTo(10, size - 10);
      ctx.stroke();
    } else if (surfaceType === 'glue') {
      // Glue dotted surface
      ctx.fillStyle = '#666666';
      for (let x = 20; x < size; x += 30) {
        for (let y = 20; y < size; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.studTextureCache.set(key, texture);
    return texture;
  }

  /**
   * Generates decal textures for Spawn points, TNT, Trampolines, and Conveyors
   */
  public getSpecialDecal(type: 'spawn' | 'tnt' | 'trampoline' | 'conveyor'): THREE.CanvasTexture {
    if (this.decalCache.has(type)) {
      return this.decalCache.get(type)!;
    }

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (type === 'spawn') {
      // SpawnLocation Decal (Sun / Star symbol)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Outer blue circle
      ctx.fillStyle = '#0055ff';
      ctx.beginPath();
      ctx.arc(128, 128, 110, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Star/Sun rays
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      const numPoints = 8;
      for (let i = 0; i < numPoints * 2; i++) {
        const radius = i % 2 === 0 ? 80 : 35;
        const angle = (i * Math.PI) / numPoints;
        const x = 128 + Math.cos(angle) * radius;
        const y = 128 + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Center smiley / emblem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(128, 128, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0055ff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPAWN', 128, 134);
    } else if (type === 'tnt') {
      // TNT explosive brick pattern
      ctx.fillStyle = '#c92a2a';
      ctx.fillRect(0, 0, size, size);

      // Hazard diagonal yellow stripes
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      for (let i = -size; i < size * 2; i += 60) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 30, 0);
        ctx.lineTo(i + 30 + size, size);
        ctx.lineTo(i + size, size);
      }
      ctx.fill();

      // Central TNT banner
      ctx.fillStyle = '#111111';
      ctx.fillRect(20, 80, size - 40, 96);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 80, size - 40, 96);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 128, 128);
    } else if (type === 'trampoline') {
      // Super bounce trampoline decal
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(128, 128, 90, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#00ff88';
      // Triple upward chevrons / bounce arrows
      for (let y = 160; y >= 90; y -= 35) {
        ctx.beginPath();
        ctx.moveTo(70, y);
        ctx.lineTo(128, y - 30);
        ctx.lineTo(186, y);
        ctx.lineTo(128, y - 10);
        ctx.closePath();
        ctx.fill();
      }
    } else if (type === 'conveyor') {
      // Animated-look conveyor chevrons
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#ffaa00';
      for (let y = 20; y < size; y += 60) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(128, y + 40);
        ctx.lineTo(216, y);
        ctx.lineTo(128, y + 20);
        ctx.closePath();
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.decalCache.set(type, texture);
    return texture;
  }

  /**
   * Generates face textures for Verlex avatars
   */
  public getAvatarFaceTexture(face: string): THREE.CanvasTexture {
    const key = `face_${face}`;
    if (this.decalCache.has(key)) {
      return this.decalCache.get(key)!;
    }

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    switch (face) {
      case 'determined':
        // Angled angry/determined eyebrows
        ctx.beginPath();
        ctx.moveTo(60, 75);
        ctx.lineTo(100, 88);
        ctx.moveTo(196, 75);
        ctx.lineTo(156, 88);
        ctx.stroke();
        // Eyes
        ctx.beginPath();
        ctx.arc(80, 105, 12, 0, Math.PI * 2);
        ctx.arc(176, 105, 12, 0, Math.PI * 2);
        ctx.fill();
        // Gritted teeth / determined mouth
        ctx.beginPath();
        ctx.moveTo(85, 165);
        ctx.lineTo(171, 165);
        ctx.stroke();
        break;

      case 'oops':
        // Shocked / 'Oof' face
        ctx.beginPath();
        ctx.arc(80, 95, 16, 0, Math.PI * 2);
        ctx.arc(176, 95, 16, 0, Math.PI * 2);
        ctx.fill();
        // O-shaped mouth
        ctx.beginPath();
        ctx.arc(128, 160, 26, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'cool':
        // Sunglasses face
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(45, 80, 166, 35);
        // Left lens
        ctx.beginPath();
        ctx.moveTo(50, 85);
        ctx.lineTo(115, 85);
        ctx.lineTo(110, 130);
        ctx.lineTo(60, 130);
        ctx.closePath();
        ctx.fill();
        // Right lens
        ctx.beginPath();
        ctx.moveTo(141, 85);
        ctx.lineTo(206, 85);
        ctx.lineTo(196, 130);
        ctx.lineTo(146, 130);
        ctx.closePath();
        ctx.fill();
        // Smug grin
        ctx.beginPath();
        ctx.arc(128, 140, 45, 0.1 * Math.PI, 0.6 * Math.PI);
        ctx.stroke();
        break;

      case 'smirk':
        // Smirk
        ctx.beginPath();
        ctx.arc(80, 95, 14, 0, Math.PI * 2);
        ctx.arc(176, 95, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(90, 160);
        ctx.quadraticCurveTo(140, 175, 185, 135);
        ctx.stroke();
        break;

      case 'check_it':
        // Check It Face
        ctx.lineWidth = 9;
        ctx.beginPath();
        // Left eyebrow angled down
        ctx.moveTo(60, 75);
        ctx.lineTo(100, 90);
        // Right eyebrow raised
        ctx.moveTo(155, 75);
        ctx.lineTo(195, 68);
        ctx.stroke();
        // Eyes
        ctx.beginPath();
        ctx.arc(80, 110, 13, 0, Math.PI * 2);
        ctx.arc(176, 100, 14, 0, Math.PI * 2);
        ctx.fill();
        // Big confident smirk
        ctx.beginPath();
        ctx.moveTo(80, 150);
        ctx.quadraticCurveTo(130, 180, 185, 140);
        ctx.stroke();
        break;

      case 'noob':
      case 'Verlex':
      case 'smile':
      default:
        //  Verlex default smile
        // Left Eye (two vertical capsule dots)
        ctx.beginPath();
        ctx.arc(80, 95, 14, 0, Math.PI * 2);
        ctx.fill();
        // Right Eye
        ctx.beginPath();
        ctx.arc(176, 95, 14, 0, Math.PI * 2);
        ctx.fill();
        // Big happy mouth
        ctx.beginPath();
        ctx.arc(128, 125, 55, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.decalCache.set(key, texture);
    return texture;
  }

  /**
   * Generates - Verlex T-Shirt graphics
   */
  public getAvatarTShirtTexture(tshirt: string = 'verlex_r'): THREE.CanvasTexture {
    const key = `tshirt_${tshirt}`;
    if (this.decalCache.has(key)) {
      return this.decalCache.get(key)!;
    }

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Transparent canvas
    ctx.clearRect(0, 0, size, size);

    if (tshirt === 'verlex_v' || tshirt === 'verlex_r') {
      // Red VERLEX "V" Logo Badge
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(48, 48, 160, 160);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 6;
      ctx.strokeRect(48, 48, 160, 160);

      // Red bold V
      ctx.fillStyle = '#d32f2f';
      ctx.font = '900 110px Arial Black, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('V', 128, 126);

      // Small VERLEX underneath
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('VERLEX', 128, 185);
    } else if (tshirt === 'verlex_logo' || tshirt === 'verlex_logo') {
      // Red Beveled VERLEX Logo
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(36, 68, 184, 120);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 5;
      ctx.strokeRect(36, 68, 184, 120);

      ctx.fillStyle = '#cc0000';
      ctx.font = '900 36px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VERLEX', 128, 128);
    } else if (tshirt === 'bloxxer') {
      // Bloxxer T-Shirt (crossed swords / brick)
      ctx.fillStyle = '#111111';
      ctx.fillRect(40, 40, 176, 176);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, 176, 176);

      ctx.fillStyle = '#f1c40f';
      ctx.font = '900 28px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLOXXER', 128, 80);

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(78, 105, 100, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('100 KO', 128, 137);
    } else if (tshirt === 'builder') {
      // Builder / Hammer T-Shirt
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(40, 40, 176, 176);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 176, 176);

      ctx.fillStyle = '#f39c12';
      ctx.font = '900 26px Arial Black, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUILDER', 128, 80);

      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(116, 100, 24, 80);
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(86, 95, 84, 30);
    } else if (tshirt === 'brick_smith') {
      // BrickSmith T-Shirt
      ctx.fillStyle = '#8e44ad';
      ctx.fillRect(40, 40, 176, 176);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 5;
      ctx.strokeRect(40, 40, 176, 176);

      ctx.fillStyle = '#f1c40f';
      ctx.font = '900 24px Arial Black, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BRICK', 128, 85);
      ctx.fillText('SMITH', 128, 115);

      ctx.fillStyle = '#e67e22';
      ctx.fillRect(78, 135, 100, 40);
    } else if (tshirt === 'happy') {
      // Smiley T-Shirt
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(128, 128, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(100, 110, 10, 0, Math.PI * 2);
      ctx.arc(156, 110, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(128, 125, 42, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.decalCache.set(key, texture);
    return texture;
  }
}

export const textureFactory = new TextureFactory();
