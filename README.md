# fwm-website

Official website and interactive web sandbox for [fwm](https://github.com/iluaii/fwm).

Live Demo: https://fwm-website.vercel.app

[![Astro](https://img.shields.io/badge/Astro-v7.1-0d1117?style=square&logo=astro&logoColor=FF5D01)](https://astro.build)
[![React](https://img.shields.io/badge/React-v19.0-0d1117?style=square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4.0-0d1117?style=square&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com)
[![GSAP](https://img.shields.io/badge/GSAP-v3.15-0d1117?style=square&logo=greensock&logoColor=88CE02)](https://greensock.com)
[![z-proximity-engine](https://img.shields.io/badge/z--proximity--engine-v2.5-0d1117?style=square&logoColor=d0a82c)](https://github.com/YoussefZidan-1/z-proximity-engine)

---

## About

fwm-website is the official web showcase and documentation portal for [fwm](https://github.com/iluaii/fwm) (Physics Window Manager for Wayland).

It features a 60fps in-browser 2D physics sandbox that mirrors fwm's C algorithms (Hooke's Law spring lattice, Box2D 3.x rigid-body collisions, and procedural Web Audio knocks) alongside zero-drift documentation rendered directly from the compositor repository.

## Tech Stack

* [Astro](https://astro.build) - Static site generator and content collections pipeline.
* [React](https://react.dev) - Interactive physics sandbox and UI components.
* [Tailwind CSS](https://tailwindcss.com) - Utility-first styling with custom dark theme.
* [GSAP](https://greensock.com) & [Lenis](https://lenis.darkroom.engineering) - Animations and ticker-synchronized smooth scrolling.
* [z-proximity-engine](https://github.com/YoussefZidan-1/z-proximity-engine) - Proximity micro-interaction library created by YoussefZidan-1.

## Local Development

```bash
# Clone recursively to fetch fwm-repo docs submodule
git clone --recursive https://github.com/iluaii/fwm-website.git
cd fwm-website

# Install dependencies
npm install

# Start development server
npm run dev
```

## Maintainers

* [iluaii](https://github.com/iluaii/) - Author of fwm compositor
* [YoussefZidan-1](https://github.com/YoussefZidan-1) - Maintainer of fwm-website
