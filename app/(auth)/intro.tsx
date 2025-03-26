import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/src/utils/routes';

export default function IntroScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: 150, height: 150, marginBottom: 30 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        Welcome to HomeMeal
      </Text>
      <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 40, color: '#666' }}>
        Fresh homemade food delivered to your doorstep
      </Text>
      <TouchableOpacity
        onPress={() => router.push(ROUTES.AUTH_LOGIN)}
        style={{
          backgroundColor: '#DFD218',
          paddingVertical: 15,
          paddingHorizontal: 40,
          borderRadius: 25,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000', fontSize: 16, fontWeight: '600' }}>
          Get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
}
