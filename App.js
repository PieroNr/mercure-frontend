import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import LoadingPos from './components/loading-pos';
import EventSource from 'react-native-event-source';





export default function App() {
  
  
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <LoadingPos></LoadingPos>
      <StatusBar style="auto" />
    </View>
  );
  
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
