import { axiosi } from "../../config/axios";

export const fetchLoggedInUserById = async (id) => {
  const res = await axiosi.get(`/users/${id}`);
  return res.data;
};

export const updateUserById = async (update) => {
  const res = await axiosi.patch(`/users/${update._id}`, update);
  return res.data;
};

export const updateUserProfile = async ({ id, data, s3Uploads }) => {
  const res = await axiosi.patch(`/users/${id}/profile`, {
    ...data,
    ...(s3Uploads && Object.keys(s3Uploads).length
      ? { s3_uploads: JSON.stringify(s3Uploads) }
      : {}),
  });
  return res.data;
};

export const completeUserOnboarding = async ({ id, data, s3Uploads }) => {
  const res = await axiosi.post(`/users/${id}/complete-onboarding`, {
    ...data,
    ...(s3Uploads && Object.keys(s3Uploads).length
      ? { s3_uploads: JSON.stringify(s3Uploads) }
      : {}),
  });
  return res.data;
};
