# World Time Agent (Next.js)

A modern world time converter with a beautiful UI, built with Next.js, React, and Tailwind CSS.

## Features
- View and compare times across multiple cities
- Add or remove locations (default: New York, London, Tokyo, Beijing)
- Drag-and-drop to reorder cities
- Responsive, mobile-friendly design
- Dark mode support

## Tech Stack
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [date-fns](https://date-fns.org/) & [date-fns-tz](https://github.com/marnusw/date-fns-tz)
- [dnd-kit](https://dndkit.com/) for drag-and-drop

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   # or
yarn install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
yarn dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Project Structure
- `src/app/` — Next.js app entry, layout, and global styles
- `src/components/` — UI components
- `src/hooks/` — Custom React hooks
- `src/utils/` — Utility functions
- `public/` — Static assets

## Notes for Contributors
- Uses TypeScript and absolute imports (see `tsconfig.json`)
- Tailwind CSS is configured in `tailwind.config.js`
- Global styles in `src/app/globals.css`
- No hardcoded absolute paths; all assets are referenced relatively
- To add a new city/timezone, use the UI or update the default list in the code

## Migration Notes
- Migrated from Create React App to Next.js (App Router)
- All legacy and duplicate files have been cleaned up
- If you moved this folder, run `npm install` again to ensure dependencies are linked
- Initialize a new git repo if needed: `git init && git add . && git commit -m "Initial commit"`

## License
MIT
