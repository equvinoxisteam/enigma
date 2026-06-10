import axiosInstance from './axios';

export const contactAPI = {
  submit: async ({ name, email, phone, subject, message }) => {
    const response = await axiosInstance.post('/api/contact/submit', {
      name,
      email,
      phone: phone || '',
      subject,
      message
    });
    return response.data;
  }
};
