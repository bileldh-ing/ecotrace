// EcoTrace - Color Palette
// Ultra-premium dark theme with blue-to-green gradients

export default {
    // Main backgrounds
    background_main: '#050505',
    background_card: '#121212',
    background_overlay: 'rgba(10, 10, 20, 0.75)',

    // Text colors
    text_primary: '#FFFFFF',
    text_secondary: '#A0A0A0',
    text_muted: '#666666',

    // Accent gradients (Dark Blue → Green)
    accent_gradient_start: '#001F3F', // Deep navy blue
    accent_gradient_end: '#2ECC71',   // Vibrant green

    // Status colors
    alert_high: '#FF4C4C',      // Red for emergencies
    alert_moderate: '#F59E0B',  // Orange for warnings
    success: '#00E676',         // Bright green for success

    // Impact metrics colors
    tree_green: '#22C55E',
    animal_purple: '#A855F7',
    co2_blue: '#3B82F6',

    // UI element colors
    border_gradient: ['#001F3F', '#2ECC71'],
    accent_gradient: ['#001F3F', '#2ECC71'],
    card_border: 'rgba(59, 130, 246, 0.3)',
    glass_overlay: 'rgba(255, 255, 255, 0.05)',

    // EcoTrace specific
    currency: 'TND',
    
    // Priority colors for events
    priority_high: '#FF4C4C',
    priority_medium: '#FFC107',
    priority_normal: '#00E676',

    // Severity levels (for emergency events)
    severity: {
        minor: '#FCD34D',      // Yellow (1-3)
        moderate: '#FB923C',   // Orange (4-6)
        serious: '#DC2626',    // Dark red (7-9)
        critical: '#991B1B',   // Darkest red (10)
    },

    // Button states
    button_disabled: '#475569',
    button_active: ['#667eea', '#764ba2'], // Purple gradient
};
