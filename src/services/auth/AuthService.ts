import axios from 'axios';
import { UserLoginDto } from '../../interfaces/user/UserLoginDto';
import { UserLogoutDto } from '../../interfaces/user/UserLogoutDto';
import User from '../../models/User';
import getToken from '../../modules/jwtHandler';
import exceptionMessage from '../../modules/exceptionMessage';
import jwt from 'jsonwebtoken';

// 카카오랑 통신하기 -> 유저 정보 가져와
// 토큰 발급
// 유저 확인하기 -> 있으면 바로 리턴 (토큰은 발급해줘야징)
// 없으면 -> 유저정보 디비에 넣어줘 create + 토큰 발급해주기
// 토큰 리턴
const kakaoLogin = async (userLoginDto: UserLoginDto) => {
  try {
    // 필요한 값이 들어있는 지 체크
    if (!userLoginDto.fcmToken || !userLoginDto.socialToken) {
      return exceptionMessage.NULL_VALUE;
    }

    const kakaoUser = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${userLoginDto.socialToken}`,
      },
    });

    const kakaoUserData = kakaoUser.data;

    // 카카오 계정이 있는지 체크
    if (!kakaoUserData.id) {
      return exceptionMessage.INVALID_USER;
    }

    const existUser = await User.findOne({
      socialId: kakaoUserData.id as string,
    });

    // 유저가 db에 없는 경우 유저 회원 가입
    if (!existUser) {
      const user = new User({
        socialType: 'KAKAO',
        socialId: kakaoUserData.id as string,
        fcmTokens: [userLoginDto.fcmToken],
      });

      const jwtToken = getToken(user.id);
      user.accessToken = jwtToken;
      await user.save();

      return jwtToken;
    }

    // 유저가 db에 있으면 로그인
    existUser.accessToken = getToken(existUser.id);
    await User.findByIdAndUpdate(existUser._id, existUser);
    return existUser.accessToken;
  } catch (error) {
    console.log('kakao token error');
    return null;
  }
};

const appleLogin = async (userLoginDto: UserLoginDto) => {
  try {
    const user = jwt.decode(userLoginDto.socialToken);

    // 애플 유저 토큰 에러
    if (user === null) {
      return null;
    }
    if (!(user as jwt.JwtPayload).sub) {
      return exceptionMessage.INVALID_USER;
    }
  } catch (error) {
    console.log('apple token error');
    return null;
  }
  // jwt decode 하면 그냥 바로 유저정보 가져올 수 있어 통신 안해도

  // 토큰 발급

  // 유저 확인하기 -> 있으면 바로 리턴 (토큰은 발급해줘야징)

  // 없으면 -> 유저정보 디비에 넣어줘 create + 토큰 발급해주기

  // 토큰 리턴
};

const socialLogout = async (userLogoutDto: UserLogoutDto) => {
  try {
    const user = await User.findById(userLogoutDto.userId);
    if (!user) {
      return null;
    }

    const fcmToken = userLogoutDto.fcmToken;
    if (!fcmToken) {
      return exceptionMessage.NULL_VALUE;
    }
    console.log(fcmToken);
    console.log(user);
    if (!user.fcmTokens.includes(fcmToken)) {
      return exceptionMessage.FCMTOKEN_INVALID;
    }

    for(let i = 0; i < user.fcmTokens.length; i++) {
      if(user.fcmTokens[i] === fcmToken)  {
        user.fcmTokens.splice(i, 1);
        i--;
      }
    }
    const fcmTokens = user.fcmTokens;
    await user.updateOne({fcmTokens});
    return { user };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const AuthService = {
  kakaoLogin,
  appleLogin,
  socialLogout,
};

export default AuthService;
