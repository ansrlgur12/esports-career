import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import { AvatarState } from "../types/game";

/*
에셋 위치:

assets/avatar/face/
  face_01.png
  face_02.png
  face_03.png

assets/avatar/eyes/
  eyes_01.png
  eyes_02.png
  eyes_03.png

assets/avatar/nose_mouth/
  nose_mouth_01.png
  nose_mouth_02.png
  nose_mouth_03.png

assets/avatar/hair/
  hair_01.png
  hair_02.png
  hair_03.png
  hair_04.png

assets/avatar/accessory/
  accessory_01.png  // 검은 네모 안경
  accessory_02.png  // 투명테 동그란 안경

face/hair는 1254x1254 전체 캔버스 기준으로 그려져 있어 그대로 꽉 채움.
eye/mouth/accessory는 잘라낸 이미지라 LAYOUT 값으로 위치/크기를 지정함.
*/

// 아바타 박스 대비 비율. 가로 중앙 정렬, width로 크기를 정하고 높이는 원본 비율을 따름.
interface Placement {
  top: number;
  width: number;
}

const FULL: Placement = { top: 0, width: 1 };

const LAYOUT = {
  eyes: { top: 0.35, width: 0.45 },
  noseMouth: { top: 0.515, width: 0.38 },
};

const ACCESSORY_LAYOUT: Record<number, Placement> = {
  1: { top: 0.27, width: 0.42 },
  2: { top: 0.4, width: 0.43 },
};

const FACES: ImageSourcePropType[] = [
  require("../../assets/avatar/face/face_01.png"),
  require("../../assets/avatar/face/face_02.png"),
  require("../../assets/avatar/face/face_03.png"),
];

const EYES: ImageSourcePropType[] = [
  require("../../assets/avatar/eye/eye_01.png"),
  // require("../../assets/avatar/eye/eye_02.png"),
  // require("../../assets/avatar/eye/eye_03.png"),
];

const NOSE_MOUTHS: ImageSourcePropType[] = [
  require("../../assets/avatar/mouth/mouth_01.png"),
  // require("../../assets/avatar/mouth/mouth_02.png"),
  // require("../../assets/avatar/mouth/mouth_03.png"),
];

const HAIRS: ImageSourcePropType[] = [
  require("../../assets/avatar/hair/hair_01.png"),
  // require("../../assets/avatar/hair/hair_02.png"),
  // require("../../assets/avatar/hair/hair_03.png"),
  // require("../../assets/avatar/hair/hair_04.png"),
];

const ACCESSORIES: Record<number, ImageSourcePropType | null> = {
  0: null,
  1: require("../../assets/avatar/accessory/glasses_black.png"),
  2: require("../../assets/avatar/accessory/glasses_clear.png"),
};

interface Props {
  avatar: AvatarState;
  size?: number;
  backgroundColor?: string;
  borderRadius?: number;
}

export function Avatar({
  avatar,
  size = 320,
  backgroundColor = "#E9ECEF",
  borderRadius = 24,
}: Props) {
  const face = FACES[avatar.face] ?? FACES[0];
  const eyes = EYES[avatar.eyes] ?? EYES[0];
  const noseMouth = NOSE_MOUTHS[avatar.noseMouth] ?? NOSE_MOUTHS[0];
  const hair = HAIRS[avatar.hair] ?? HAIRS[0];
  const accessory = ACCESSORIES[avatar.accessory] ?? null;

  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          backgroundColor,
          borderRadius,
        },
      ]}
    >
      <Layer source={face} placement={FULL} size={size} />
      <Layer source={eyes} placement={LAYOUT.eyes} size={size} />
      <Layer source={noseMouth} placement={LAYOUT.noseMouth} size={size} />
      <Layer source={hair} placement={FULL} size={size} />

      {accessory && (
        <Layer
          source={accessory}
          placement={ACCESSORY_LAYOUT[avatar.accessory] ?? FULL}
          size={size}
        />
      )}
    </View>
  );
}

function Layer({
  source,
  placement,
  size,
}: {
  source: ImageSourcePropType;
  placement: Placement;
  size: number;
}) {
  const { width: w, height: h } = Image.resolveAssetSource(source);
  const width = size * placement.width;
  const height = width * (h / w);

  return (
    <Image
      source={source}
      style={[
        styles.layer,
        {
          width,
          height,
          top: size * placement.top,
          left: (size - width) / 2,
        },
      ]}
      resizeMode="contain"
    />
  );
}

export default Avatar;

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "hidden",
  },
  layer: {
    position: "absolute",
  },
});
