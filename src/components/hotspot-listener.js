/**
 * A-Frame component that listens for clicks on hotspots and emits a custom event
 */
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('swt-hotspot-listener', {
    schema: {
      hotspotData: { type: 'string', default: '{}' }
    },

    init: function () {
      this.onClick = this.onClick.bind(this);
      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
    },

    play: function () {
      this.el.addEventListener('click', this.onClick);
      this.el.addEventListener('mouseenter', this.onMouseEnter);
      this.el.addEventListener('mouseleave', this.onMouseLeave);
    },

    pause: function () {
      this.el.removeEventListener('click', this.onClick);
      this.el.removeEventListener('mouseenter', this.onMouseEnter);
      this.el.removeEventListener('mouseleave', this.onMouseLeave);
    },

    onClick: function (evt) {
      const hotspotData = JSON.parse(this.data.hotspotData);
      
      // Emit custom event that the Tour class can listen to
      this.el.sceneEl.emit('swt-hotspot-clicked', {
        hotspotData: hotspotData
      });
    },

    onMouseEnter: function (evt) {
      const hotspotData = JSON.parse(this.data.hotspotData);
      
      // Show tooltip if exists
      if (hotspotData.tooltip) {
        this.el.sceneEl.emit('swt-hotspot-hover', {
          hotspotData: hotspotData,
          isHovering: true
        });
      }

      // Add visual feedback
      this.el.setAttribute('scale', this.getScaledSize(1.2));
    },

    onMouseLeave: function (evt) {
      const hotspotData = JSON.parse(this.data.hotspotData);
      
      // Hide tooltip
      if (hotspotData.tooltip) {
        this.el.sceneEl.emit('swt-hotspot-hover', {
          hotspotData: hotspotData,
          isHovering: false
        });
      }

      // Reset scale
      this.el.setAttribute('scale', this.getOriginalScale());
    },

    getOriginalScale: function () {
      const hotspotData = JSON.parse(this.data.hotspotData);
      return hotspotData.appearance?.scale || '1 1 1';
    },

    getScaledSize: function (multiplier) {
      const scale = this.getOriginalScale();
      const parts = scale.split(' ').map(Number);
      return `${parts[0] * multiplier} ${parts[1] * multiplier} ${parts[2] * multiplier}`;
    }
  });

  /**
   * Billboard component - Makes an entity always face the camera
   */
  AFRAME.registerComponent('swt-billboard', {
    schema: {
      enabled: { type: 'boolean', default: true }
    },

    init: function () {
      this.camera = null;
    },

    tick: function () {
      if (!this.data.enabled) return;

      // Find camera if not cached
      if (!this.camera) {
        this.camera = this.el.sceneEl.camera;
        if (!this.camera) return;
      }

      // Get camera world position
      const cameraPosition = new THREE.Vector3();
      this.camera.getWorldPosition(cameraPosition);

      // Get this element's world position
      const elementPosition = new THREE.Vector3();
      this.el.object3D.getWorldPosition(elementPosition);

      // Make the element look at the camera
      this.el.object3D.lookAt(cameraPosition);
    }
  });
}

export default 'swt-hotspot-listener';
