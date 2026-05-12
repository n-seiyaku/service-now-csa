# ServiceNow CSA Quiz App

A robust quiz application built with React, TypeScript, and Vite, designed for ServiceNow CSA (Certified System Administrator) exam preparation.

## Key Features

- **Interactive Quiz Experience**: Solve questions with a smooth and intuitive UI.
- **Advanced Review Mode**:
  - Pagination and keyboard shortcut support for efficient learning.
  - Advanced filtering based on correct/incorrect answers and Mastered status.
- **Progress Tracking**:
  - Utilizes Local Storage to persist your answer history and mastered questions locally.
  - Seamlessly resume your learning session from where you left off.
- **Modern & Responsive UI**:
  - Styled with Tailwind CSS.
  - Sleek design using Lucide React icons.
  - UI designed for focus, including a toggle to minimize the scoreboard.
- **Flexible Data Structure**: Efficiently loads and displays assessment data (questions, choices, explanations, etc.) formatted in JSON.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Linter & Formatter**: ESLint

## Getting Started

### Prerequisites

- Node.js must be installed on your machine.

### Installation Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173` by default.

3. Build for production:

   ```bash
   npm run build
   ```

4. Preview the production build:
   ```bash
   npm run preview
   ```

## Directory Structure

- `src/assessments/`: JSON data for quiz questions (e.g., `practice-2.json`, `practice-vi.json`)
- `src/components/`: Reusable UI components (e.g., `ScorePanel`, `QuestionCard`)
- `src/index.css`: Global styles including Tailwind CSS configuration

## Future Roadmap

- Multi-language support
- Further optimization of the data structure.
