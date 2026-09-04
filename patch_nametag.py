import os

filepath = 'src/game/avatarRig.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Add lastName, lastHealth, lastMaxHealth to track state
old_class_start = '''export class AvatarRig {
  public rootGroup: THREE.Group;'''

new_class_start = '''export class AvatarRig {
  public rootGroup: THREE.Group;
  private lastName: string = '';
  private lastHealth: number = -1;
  private lastMaxHealth: number = -1;'''

content = content.replace(old_class_start, new_class_start)

# Update updateNameTag
old_update = '''  public updateNameTag(name: string, health: number, maxHealth: number) {
    if (this.nameTagSprite) {'''

new_update = '''  public updateNameTag(name: string, health: number, maxHealth: number, force: boolean = false) {
    if (!force && name === this.lastName && health === this.lastHealth && maxHealth === this.lastMaxHealth) {
      return;
    }
    this.lastName = name;
    this.lastHealth = health;
    this.lastMaxHealth = maxHealth;

    if (this.nameTagSprite) {'''

content = content.replace(old_update, new_update)

with open(filepath, 'w') as f:
    f.write(content)

