import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.localboost.ai.customer',
  appName: 'LocalBoost Customer App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
