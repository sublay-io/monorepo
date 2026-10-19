import "./global.css";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import {
  SublayProvider,
  useAuth,
  useSignTestingJwt,
  useUser,
} from "@sublay/expo";

import * as TailwindThreaded from "./components/tailwind/comments-threaded";
import * as StyledThreaded from "./components/styled/comments-threaded";
import { SocialCommentSection as TailwindSocial } from "./components/tailwind/comments-social";
import { SocialCommentSection as StyledSocial } from "./components/styled/comments-social";

const PROJECT_ID = process.env.EXPO_PUBLIC_SUBLAY_PROJECT_ID;
const PRIVATE_KEY = process.env.EXPO_PUBLIC_SUBLAY_PRIVATE_KEY;

// The same entities the web playground uses, so the same comments show on
// web and on the phone.
const FOREIGN_IDS = {
  threaded: "playground-threaded-comments",
  social: "playground-social-comments",
} as const;

type Section = "threaded" | "social";
type Variant = "tailwind" | "styled";
type Theme = "light" | "dark";

const COLORS = {
  light: {
    bg: "#ffffff",
    bar: "#f3f4f6",
    text: "#111827",
    muted: "#6b7280",
    border: "#e5e7eb",
    active: "#111827",
    activeText: "#ffffff",
  },
  dark: {
    bg: "#262626", // neutral-800, the components' dark background
    bar: "#171717",
    text: "#fafafa",
    muted: "#a3a3a3",
    border: "#404040",
    active: "#fafafa",
    activeText: "#171717",
  },
};

// A random "adjective-color-animal" name, like the web playground's mock user.
const ADJECTIVES = ["brave", "calm", "eager", "fancy", "gentle", "happy", "jolly", "kind", "lucky", "proud", "quiet", "witty"];
const HUES = ["amber", "azure", "coral", "crimson", "golden", "indigo", "jade", "lime", "olive", "plum", "ruby", "teal"];
const ANIMALS = ["badger", "otter", "falcon", "lynx", "panda", "heron", "koala", "fox", "gecko", "moose", "owl", "yak"];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
const randomUsername = () => `${pick(ADJECTIVES)}-${pick(HUES)}-${pick(ANIMALS)}`;

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {PROJECT_ID ? (
          <SublayRoot projectId={PROJECT_ID} />
        ) : (
          <SafeAreaView style={styles.center}>
            <Text>EXPO_PUBLIC_SUBLAY_PROJECT_ID is not set. See README.md.</Text>
          </SafeAreaView>
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// Signs a test user's JWT on the server (useSignTestingJwt) and hands it to
// SublayProvider. With no token the components are read-only.
function SublayRoot({ projectId }: { projectId: string }) {
  const signTestingJwt = useSignTestingJwt();
  const [token, setToken] = useState<string | undefined>();
  const [signingIn, setSigningIn] = useState(false);

  const signIn = useCallback(async () => {
    if (!PRIVATE_KEY) return;
    const username = randomUsername();
    setSigningIn(true);
    try {
      const signed = await signTestingJwt({
        projectId,
        privateKey: PRIVATE_KEY,
        userData: { id: username, username },
      });
      setToken(signed ?? undefined);
    } finally {
      setSigningIn(false);
    }
  }, [projectId, signTestingJwt]);

  return (
    <SublayProvider projectId={projectId} signedToken={token}>
      <Playground
        canSignIn={Boolean(PRIVATE_KEY)}
        signingIn={signingIn}
        onSignIn={signIn}
        onSignedOut={() => setToken(undefined)}
      />
    </SublayProvider>
  );
}

function Playground({
  canSignIn,
  signingIn,
  onSignIn,
  onSignedOut,
}: {
  canSignIn: boolean;
  signingIn: boolean;
  onSignIn: () => void;
  onSignedOut: () => void;
}) {
  const [section, setSection] = useState<Section>("threaded");
  const [variant, setVariant] = useState<Variant>("tailwind");
  const [theme, setTheme] = useState<Theme>("light");
  const { user } = useUser();
  const { signOut } = useAuth();
  const c = COLORS[theme];

  const handleSignOut = async () => {
    // Sign out of the SDK too: @sublay/expo keeps the session in SecureStore,
    // so dropping the token alone would restore the same user.
    await signOut();
    onSignedOut();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={[styles.bar, { backgroundColor: c.bar, borderColor: c.border }]}>
        <View style={styles.row}>
          <Segmented
            theme={theme}
            value={section}
            onChange={setSection}
            options={[
              { value: "threaded", label: "Threaded" },
              { value: "social", label: "Social" },
            ]}
          />
          <Segmented
            theme={theme}
            value={variant}
            onChange={setVariant}
            options={[
              { value: "tailwind", label: "Tailwind" },
              { value: "styled", label: "Styled" },
            ]}
          />
          <Segmented
            theme={theme}
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </View>
        <View style={styles.row}>
          <Text style={[styles.userText, { color: c.muted }]} numberOfLines={1}>
            {user
              ? `Signed in as ${user.username ?? user.id}`
              : canSignIn
                ? "Signed out (read-only)"
                : "No EXPO_PUBLIC_SUBLAY_PRIVATE_KEY: read-only"}
          </Text>
          {signingIn ? (
            <ActivityIndicator size="small" color={c.text} />
          ) : user ? (
            <SmallButton theme={theme} label="Sign out" onPress={handleSignOut} />
          ) : canSignIn ? (
            <SmallButton theme={theme} label="Sign in as random user" onPress={onSignIn} />
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {section === "threaded" ? (
          <ThreadedScreen key={variant} variant={variant} theme={theme} />
        ) : variant === "tailwind" ? (
          <TailwindSocial
            key="tailwind"
            foreignId={FOREIGN_IDS.social}
            createIfNotFound
            theme={theme}
          />
        ) : (
          <StyledSocial
            key="styled"
            foreignId={FOREIGN_IDS.social}
            createIfNotFound
            theme={theme}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Threaded on React Native is three pieces the screen places: the wrapper,
// the section inside the screen's scroll view (below the entity, which scrolls
// away with the comments), and the input pinned under the scroll view.
function ThreadedScreen({ variant, theme }: { variant: Variant; theme: Theme }) {
  const { ThreadedComments, ThreadedCommentSection, ThreadedCommentInput } =
    variant === "tailwind" ? TailwindThreaded : StyledThreaded;

  return (
    <ThreadedComments
      foreignId={FOREIGN_IDS.threaded}
      createIfNotFound
      theme={theme}
    >
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <FakeEntity theme={theme} />
        <ThreadedCommentSection />
      </ScrollView>
      <ThreadedCommentInput />
    </ThreadedComments>
  );
}

function FakeEntity({ theme }: { theme: Theme }) {
  const c = COLORS[theme];
  return (
    <View style={[styles.entity, { borderColor: c.border }]}>
      <Text style={[styles.entityTitle, { color: c.text }]}>
        A test entity for the threaded comments
      </Text>
      <Text style={[styles.entityBody, { color: c.muted }]}>
        This block stands in for your app's content: a post, an article, a
        product page. It sits in the same scroll view as the comments, so it
        scrolls away as you read down the thread.
      </Text>
      <Text style={[styles.entityBody, { color: c.muted }]}>
        The comment box stays pinned at the bottom of the screen. Tap Reply on
        a comment to focus it with a "Replying to" bar.
      </Text>
    </View>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  theme,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  theme: Theme;
}) {
  const c = COLORS[theme];
  return (
    <View style={[styles.segmented, { borderColor: c.border }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && { backgroundColor: c.active }]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? c.activeText : c.text },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  theme,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
}) {
  const c = COLORS[theme];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { borderColor: c.border }]}
    >
      <Text style={[styles.segmentText, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  bar: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  segment: { paddingHorizontal: 8, paddingVertical: 4 },
  segmentText: { fontSize: 12, fontWeight: "500" },
  userText: { flex: 1, fontSize: 12 },
  button: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  entity: {
    padding: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entityTitle: { fontSize: 20, fontWeight: "700" },
  entityBody: { fontSize: 14, lineHeight: 20 },
});
