import { Redirect } from "expo-router";

/**
 * Legacy route compatibility.
 * v15부터 TRAINEE 단계는 ACADEMY에 통합되었습니다.
 */
export default function TraineeLegacyRedirect() {
  return <Redirect href="/academy" />;
}
