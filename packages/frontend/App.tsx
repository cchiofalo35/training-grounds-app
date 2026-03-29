import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './app/redux/store';
import { RootNavigator } from './app/navigation/RootNavigator';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
