import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  // console.log(JSON.parse(email, password));
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://http:127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged In successfully');
      window.setTimeOut(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out try again');
  }
};
