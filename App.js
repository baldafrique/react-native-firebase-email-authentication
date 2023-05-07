import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image,
} from "react-native";
import styled from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { useState, useRef, forwardRef, useEffect } from "react";
import PropTypes from "prop-types";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import config from "./firebase.json";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const colors = {
  WHITE: "#ffffff",
  BLACK: "#000000",
  GREY_1: "#d5d5d5",
  RED: "#e84118",
  BLUE: "#3679fe",
};

const theme = {
  background: colors.WHITE,
  text: colors.BLACK,
  errorText: colors.RED,

  // Input Component
  label: colors.GREY_1,
  inputBorder: colors.GREY_1,

  // Button Component
  buttonBackground: colors.BLUE,
  buttonTitle: colors.WHITE,
  buttonFilledTitle: colors.BLUE,
  buttonLogout: colors.RED,

  // Navigation
  headerTintColor: colors.black,
};

const LogoContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
`;

const LogoImage = styled(Image)`
  width: 250px;
  height: 250px;
`;

const InputContainer = styled.View`
  flex-direction: column;
  width: 100%;
  margin: 10px 0;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: ${({ isFocused }) => (isFocused ? theme.text : theme.label)};
`;

const StyledTextInput = styled.TextInput`
  background-color: ${theme.background};
  color: ${theme.text};
  padding: 20px 10px;
  font-size: 16px;
  border: 1px solid ${({ isFocused }) =>
    isFocused ? theme.text : theme.inputBorder}
  border-radius: 8px;
`;

const Input = forwardRef(
  (
    {
      label,
      value,
      onChangeText,
      onSubmitEditing,
      onBlur,
      placeholder,
      isPassword,
      returnKeyType,
      maxLength,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    return (
      <InputContainer>
        <Label isFocused={isFocused}>{label}</Label>
        <StyledTextInput
          ref={ref}
          isFocused={isFocused}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur();
          }}
          placeholder={placeholder}
          secureTextEntry={isPassword}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none" // iOS only
          underlineColorAndroid="transparent" // Android only
        />
      </InputContainer>
    );
  }
);

const validateEmail = (email) => {
  // 이메일 주소는 localPart@domain.TopLevelDomain 형식으로 구성
  // 로컬 파트(localPart)는 반드시 알파벳 또는 숫자로 시작
  // at('@') 기호 반드시 포함
  // 도메인 파트는 반드시 알파벳으로 시작
  // dot('.') 기호 반드시 포함
  // 최상위 도메인(TopLevelDomain)은 반드시 최소 2개 이상 3개 이하의 알파벳이나 숫자로 구성
  const regex =
    /^[0-9?A-z0-9?]+(\.)?[0-9?A-z0-9?]+@[0-9?A-z]+\.[A-z]{2}.?[A-z]{0,3}$/;
  return regex.test(email);
};

const removeWhitespace = (text) => {
  const regex = /\s/g;
  return text.replace(regex, "");
};

const ErrorText = styled.Text`
  align-items: flex-start;
  width: 100%;
  height: 20px;
  margin-bottom: 10px;
  line-height: 20px;
  color: ${theme.errorText};
`;

const LoginContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
`;

const ButtonContainer = styled.TouchableOpacity`
  background-color: ${({ isFilled }) =>
    isFilled ? theme.buttonBackground : TRANSPARENT};
  align-items: center;
  border-radius: 4px;
  width: 100%;
  padding: 10px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const Title = styled.Text`
  height: 30px;
  line-height: 30px;
  font-size: 16px;
  color: ${({ isFilled }) =>
    isFilled ? theme.buttonTitle : theme.buttonFilledTitle};
`;

const Button = ({ containerStyle, title, onPress, isFilled, disabled }) => {
  return (
    <ButtonContainer
      style={containerStyle}
      onPress={onPress}
      isFilled={isFilled}
      disabled={disabled}
    >
      <Title isFilled={isFilled}>{title}</Title>
    </ButtonContainer>
  );
};

Button.defaultProps = {
  isFilled: true,
};

Button.propTypes = {
  containerStyle: PropTypes.object,
  title: PropTypes.string,
  onPress: PropTypes.func.isRequired,
  isFilled: PropTypes.bool,
  disabled: PropTypes.bool,
};

const TRANSPARENT = "transparent";

const app = firebase.initializeApp(config);

const Auth = app.auth();

const signup = async ({ email, password }) => {
  const { user } = await Auth.createUserWithEmailAndPassword(email, password);
  return user;
};

const login = async ({ email, password }) => {
  const { user } = await Auth.signInWithEmailAndPassword(email, password);
  return user;
};

const Login = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef();
  const [errorMessage, setErrorMessage] = useState("");
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    setDisabled(!(email && password && !errorMessage));
  }, [email, password, errorMessage]);

  const _handleEmailChange = (email) => {
    const changedEmail = removeWhitespace(email);
    setEmail(changedEmail);
    setErrorMessage(
      validateEmail(changedEmail) ? "" : "Please verify your email."
    );
  };

  const _handlePasswordChange = (password) => {
    setPassword(removeWhitespace(password));
  };

  const _handleLoginButtonPress = async () => {
    try {
      const user = await login({ email, password });
      Alert.alert("Login Success", user.email);
      navigation.navigate("LoginSuccess", { userEmail: user.email });
    } catch (e) {
      Alert.alert("Login Eroror", e.message);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flex: 1 }}
      extraScrollHeight={20}
    >
      <LoginContainer insets={insets}>
        {/* <Text>login screen</Text> */}
        {/* <Button title="Signup" onPress={() => navigation.navigate("Signup")} /> */}

        <LogoContainer insets={insets}>
          <LogoImage source={require("./assets/logo.png")} />
        </LogoContainer>

        <Input
          label="Email"
          value={email}
          onChangeText={_handleEmailChange}
          onSubmitEditing={() => passwordRef.current.focus()}
          placeholder="Email"
          returnKeyType="next"
        />
        <Input
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={_handlePasswordChange}
          onSubmitEditing={() => {
            _handleLoginButtonPress;
          }}
          placeholder="Password"
          returnKeyType="done"
          isPassword
        />
        <ErrorText>{errorMessage}</ErrorText>
        <Button
          title="Login"
          onPress={_handleLoginButtonPress}
          disabled={disabled}
        />
        <Button
          title="Sign up with email"
          onPress={() => navigation.navigate("Signup")}
          isFilled={false}
        />
      </LoginContainer>
    </KeyboardAwareScrollView>
  );
};

const SignUpContainer = styled.View`
  justify-content: center;
  align-items: center;
  background-color: ${theme.background};
  padding: 40px 20px;
`;

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [disalbed, setDisalbed] = useState(true);

  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const didMountRef = useRef();

  useEffect(() => {
    if (didMountRef.current) {
      let _errorMessage = "";
      if (!name) {
        _errorMessage = "Please enter your name.";
      } else if (!validateEmail(email)) {
        _errorMessage = "Please verify your email.";
      } else if (password.length < 6) {
        _errorMessage = "The password must contain 6 characters at least.";
      } else if (password !== passwordConfirm) {
        _errorMessage = "Passwords need to match.";
      } else {
        _errorMessage = "";
      }
      setErrorMessage(_errorMessage);
    } else {
      didMountRef.current = true;
    }
  }, [name, email, password, passwordConfirm]);

  useEffect(() => {
    setDisalbed(
      !(name && email && password && passwordConfirm && !errorMessage)
    );
  }, [name, email, password, passwordConfirm, errorMessage]);

  const _handleSignupButtonPress = async () => {
    try {
      const user = await signup({ email, password });
      console.log(user);
      Alert.alert("Signup Success", user.email);
    } catch (e) {
      Alert.alert("Signup Error", e.message);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flex: 1 }}
      extraScrollHeight={20}
    >
      <SignUpContainer>
        {/* <Text>Signup screen</Text> */}
        <Input
          label="Name"
          value={name}
          onChangeText={(text) => setName(text)}
          onSubmitEditing={() => {
            setName(name.trim());
            emailRef.current.focus();
          }}
          onBlur={() => setName(name.trim())}
          placeholder="Name"
          returnKeyType="next"
        />
        <Input
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={(text) => setEmail(removeWhitespace(text))}
          onSubmitEditing={() => {
            passwordRef.current.focus();
          }}
          placeholder="Email"
          returnKeyType="next"
        />
        <Input
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={(text) => setPassword(removeWhitespace(text))}
          onSubmitEditing={() => {
            passwordConfirmRef.current.focus();
          }}
          placeholder="Password"
          returnKeyType="done"
          isPassword
        />
        <Input
          ref={passwordConfirmRef}
          label="Password Confirm"
          value={passwordConfirm}
          onChangeText={(text) => setPasswordConfirm(removeWhitespace(text))}
          onSubmitEditing={() => {
            _handleSignupButtonPress;
          }}
          placeholder="Password"
          returnKeyType="done"
          isPassword
        />
        <ErrorText>{errorMessage}</ErrorText>
        <Button
          title="Sign Up"
          onPress={_handleSignupButtonPress}
          disabled={disalbed}
        />
      </SignUpContainer>
    </KeyboardAwareScrollView>
  );
};

const LoginSuccessScreen = ({ route }) => {
  const { userEmail } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Login Success!</Text>
      <Text>User Email: {userEmail}</Text>
    </View>
  );
};

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerTitleAlign: "center",
        cardStyle: { backgroundColor: theme.background },
        headerTintColor: theme.headerTintColor,
      }}
    >
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={Signup}
        options={{ headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="LoginSuccess"
        component={LoginSuccessScreen}
        option={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const Navigation = () => {
  return (
    <NavigationContainer>
      <AuthStack />
    </NavigationContainer>
  );
};

Input.defaultProps = {
  onBlur: () => {},
};

Input.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  onSubmitEditing: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  isPassword: PropTypes.bool,
  returnKeyType: PropTypes.oneOf(["done", "next"]),
  maxLength: PropTypes.number,
};

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      {/* <Text>Open up App.js to start working on your app!</Text> */}
      <Navigation />
    </>
  );
}
