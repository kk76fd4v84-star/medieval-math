FULL-BODY WALK — v13
Replaces the single shared hip pivot and fixed torso/arms/head of v12. v10 remains rejected.

Five characters: hero, stripe, scarf, feather, moustache. Separate hip sockets lie along the existing sloping waistline: hero offsets [36,12] and [-36,-12], companions [22,8] and [-22,-8], rotated with pelvis motion. Each thigh attaches to its own socket. Fixed-length thigh/shin chains and planted feet remain.

Upper body: torso counter-rotation, alternating shoulder swing, elbow flex, delayed head rotation/bob, and held shield lag. Hero sword/hand/forearm move together. Bare-handed companions use separate upper arms and forearms. All upper attachments inherit torso motion about the pelvis. See upper pivots in rigs/*.json and runtime.js. The head, arms and torso are no longer one static sprite.

ART: Existing torso, head, armour, companion and shield imagery is retained as cutouts. Two built-in imagegen repairs support the hero: concealed tunic under the old blade, and a cleaned sword-arm extraction. Only the forearm/hand/sword portion of that extraction is used; the existing shoulder remains. These are reference-guided repairs, not a claim that every pixel is identical to the original. Prompts are in generation-prompts.txt. Originals and repair sources are included. No per-frame image generation.

PREVIEW: open index.html. Pause, step through poses, or enable hip sockets. Moving ground reference marks indicate support-foot motion. GIFs show continuous bone playback; PNG atlases contain eight key samples.

ENGINE: 6144x768 transparent atlas per character, eight 768x768 cells, 125ms each, looping 1 second, pivot [384,680]. JSON includes measured standTop and rootMotionSpeed. Scale travel speed with display scale and animation playback rate. runtime.js + rigs/*.json + parts/*.png provide the live engine-neutral Canvas reference. Source coordinates are pixels, x right/y down, rotations radians. No native engine importer is provided.

Gear limits: shield is a separate attachment; hero hand/sword share the cleaned forearm cutout. This does not yet provide arbitrary weapon swapping, helmet up/down hand interaction, or attack/heal animations.

Validation: 1000 motion samples per character check fixed limb length, finite reachable joints, distinct hip sockets, changing upper-body channels, flat planted feet, support-foot world drift and exact loop closure. Atlas alpha/dimensions/borders and browser controls checked. These checks do not substitute for visual approval of the animation.
