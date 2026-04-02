# FenixApp Mobile

Premium MLM mobile application built with React Native (Expo) featuring a luxury gold theme.

## Features

- **Authentication**: Login, Registration with sponsor/leg selection
- **Dashboard**: Stats, rank progress, achievements
- **Binary Structure**: Interactive tree visualization
- **Linear Structure**: Hierarchical referral list
- **Shop**: Product catalog with cart
- **Packages**: Start, Standard, Business, VIP packages
- **Finance**: Balance, withdrawals, transfers, reports
- **Profile**: User info, referral links, settings

## Tech Stack

- **Framework**: Expo (Managed Workflow)
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI**: Custom "Gold" Design System
- **Icons**: Lucide React Native

## Design System

### Colors
- **Gold Palette**: `#FFD700`, `#DAA520`, `#B8860B`
- **Dark Theme**: `#0A0A0A`, `#0F0F18`, `#1A1A2E`
- **Light Theme**: `#F8F9FA`, `#FFFFFF`

### Typography
- **Body**: Montserrat
- **Display**: Playfair Display

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
fenix-mobile/
├── App.tsx                 # Main entry point
├── src/
│   ├── theme/              # Design system (colors, typography, layout)
│   ├── components/
│   │   └── ui/             # Reusable UI components
│   ├── screens/
│   │   ├── auth/           # Authentication screens
│   │   ├── home/           # Dashboard
│   │   ├── structure/      # Binary & Linear structure
│   │   ├── shop/           # Shop, Packages, Orders
│   │   ├── finance/        # Finance, Withdrawal, Transfer, Reports
│   │   └── profile/        # Profile, Notifications
│   ├── navigation/         # React Navigation setup
│   ├── store/              # Zustand stores
│   ├── services/           # API services
│   ├── hooks/              # Custom hooks
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts
└── app.json                # Expo configuration
```

## API Integration

The app uses mock data for development. To integrate with your backend:

1. Update API endpoints in `src/services/api.ts`
2. Replace mock data in stores with real API calls
3. Configure authentication tokens

### Expected API Endpoints

```
POST /api/auth/login
POST /api/auth/register
GET  /api/user/profile
GET  /api/tree/binary
GET  /api/structure/linear
GET  /api/finance/balance
POST /api/finance/withdrawal
POST /api/finance/transfer
GET  /api/shop/products
POST /api/shop/order
GET  /api/notifications
```

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## License

© 2026 FenixApp. All rights reserved.
