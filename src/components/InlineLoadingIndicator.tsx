import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

interface InlineLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

const InlineLoadingIndicator: React.FC<InlineLoadingIndicatorProps> = ({
  isVisible,
  message,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B00" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  message: {
    color: '#333333',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default InlineLoadingIndicator;
