# Arcade.software Demo Integration Guide

## Overview
The landing page is now ready for Arcade.software demo integration. The demo container is set up with proper styling and fallback content.

## Integration Points

### 1. Demo Container
- **Element ID**: `scribeschedule-demo`
- **Location**: Hero section of landing page
- **Dimensions**: 16:10 aspect ratio, minimum height 600px
- **Styling**: White background, rounded corners, shadow

### 2. Component Structure
```
src/components/ArcadeDemo.tsx - Dedicated demo component
src/components/LandingPage.tsx - Main landing page with demo section
```

### 3. Integration Steps

#### Step 1: Add Arcade Script
Add the Arcade.software script to your HTML head:
```html
<script src="https://demo.arcade.software/embed.js"></script>
```

#### Step 2: Initialize Demo
In the `ArcadeDemo.tsx` component, uncomment and modify the useEffect:
```javascript
useEffect(() => {
  if (window.Arcade && demoId) {
    window.Arcade.init({
      containerId: 'scribeschedule-demo',
      demoUrl: 'YOUR_ARCADE_DEMO_URL',
      options: {
        autoplay: false,
        showControls: true,
        responsive: true,
        theme: 'light'
      }
    });
  }
}, [demoId]);
```

#### Step 3: Replace Demo URL
Replace `YOUR_ARCADE_DEMO_URL` with your actual Arcade demo URL.

### 4. Demo Features to Showcase

The demo should highlight these key features:
1. **AI Content Creation** - Show the content generation process
2. **Multi-Platform Scheduling** - Demonstrate scheduling across Facebook, Instagram, Twitter, LinkedIn, Reddit
3. **Analytics Dashboard** - Display performance metrics and insights
4. **User Interface** - Showcase the clean, modern dashboard design

### 5. Fallback Behavior

If Arcade demo fails to load:
- Shows placeholder content with play button
- Provides "Start Free Trial" CTA
- Maintains visual consistency with the rest of the page

### 6. Responsive Design

The demo container is fully responsive:
- Desktop: Full width with 16:10 aspect ratio
- Tablet: Scales proportionally
- Mobile: Maintains aspect ratio with smaller dimensions

### 7. Browser Chrome

The demo includes realistic browser chrome:
- Traffic light buttons (red, yellow, green)
- URL bar showing "app.scribeschedule.com"
- "Live Demo" badge for authenticity

## Testing

1. Test demo loading on different devices
2. Verify fallback content displays correctly
3. Ensure CTA buttons work properly
4. Check responsive behavior across screen sizes

## Customization

You can customize:
- Demo container dimensions
- Fallback content
- Feature highlights below the demo
- Browser chrome styling
- Loading states

## Support

For Arcade.software specific integration help:
- Check Arcade documentation
- Contact Arcade support
- Review their integration examples
