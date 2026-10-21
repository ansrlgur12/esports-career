export const BACKGROUNDS = {
  HOME: {
    MORNING: require("../../assets/backgrounds/home_day.png"),
    AFTERNOON: require("../../assets/backgrounds/home_afternoon.png"),
    EVENING: require("../../assets/backgrounds/home_night.png"),
  },
  PRACTICE: {
    TRAINEE: require("../../assets/backgrounds/practice_trainee.png"),
    ACADEMY: require("../../assets/backgrounds/practice_academy.png"),
    SUB: require("../../assets/backgrounds/practice_sub.png"),
    PRO: {
      MORNING: require("../../assets/backgrounds/practice_pro_day.png"),
      AFTERNOON: require("../../assets/backgrounds/practice_pro_afternoon.png"),
      EVENING: require("../../assets/backgrounds/practice_pro_night.png"),
    },
  },
  STADIUM: require("../../assets/backgrounds/stadium.png"),
} as const;
