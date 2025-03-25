declare module "expo-image-picker" {
  export type MediaTypeOptions = {
    All: "All";
    Videos: "Videos";
    Images: "Images";
  };

  export type ImagePickerResult = {
    canceled: boolean;
    assets?: Array<{
      uri: string;
      width: number;
      height: number;
      type?: string;
      fileName?: string;
      fileSize?: number;
    }>;
  };

  export const MediaTypeOptions: MediaTypeOptions;

  export type ImagePickerOptions = {
    mediaTypes?: keyof MediaTypeOptions;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  };

  export function launchImageLibraryAsync(
    options?: ImagePickerOptions
  ): Promise<ImagePickerResult>;
  export function launchCameraAsync(
    options?: ImagePickerOptions
  ): Promise<ImagePickerResult>;
  export function requestCameraPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{
    status: "granted" | "denied";
  }>;
}
