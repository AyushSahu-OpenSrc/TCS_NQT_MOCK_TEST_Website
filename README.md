# TCS NQT Final Mock Trainer

A deploy-ready Vite + React codebase for your TCS NQT mock-test website.

## Features

- 10 full mock tests
- 81 questions per test
- No coding / no DSA coding section
- Pattern:
  - Numerical Ability: 20
  - Verbal Ability: 25
  - Reasoning Ability: 20
  - Advanced Quant: 8
  - Advanced Reasoning: 8
- Verbal timer: 25 seconds per question with auto-next
- Dashboard performance:
  - Submitted tests
  - Unlocked results
  - Average score
  - Best score
  - Weakest section
  - Section-wise result
  - Incorrect/skipped answers
  - Correct answers
  - Explanation + next-time trick
- Result unlocks 10 minutes after submit
- Red/black UI
- Alarm for overdue scheduled test
- Export/import progress for shifting data between devices
- PWA-ready basic manifest and service worker

## Important limitation

This is a frontend-only version. It works on phone/iPad/laptop through the deployed Vercel URL, but progress is saved in the browser storage of that device.

To move progress to another device, use:
Dashboard -> Export Progress
Then on another device:
Dashboard -> Import Progress

For automatic cross-device sync, add Firebase/Supabase auth + database later.

## Local Run

```bash
npm install
npm run dev
```

Open the URL shown in terminal.

## Build

```bash
npm run build
```

The production files will be created inside `dist/`.

## Vercel Deployment

1. Create a GitHub repository.
2. Upload/push this whole folder to GitHub.
3. Go to Vercel.
4. Import the GitHub repository.
5. Framework preset: Vite.
6. Build command: `npm run build`
7. Output directory: `dist`
8. Deploy.

Vercel generally auto-detects Vite projects, so build settings should normally be filled automatically.

## Phone/iPad Use

After deployment:
- Open your Vercel URL on phone/iPad.
- For app-like use, use browser menu -> Add to Home Screen.
- Keep the tab open if you want alarm sound/notification.
