// DEV MODE: fixed user for local development
const DEV_USER = {
  id: "dev-user-001",
  email: "dev@infoflow.local",
};

export async function requireAuth() {
  return DEV_USER;
}

export async function getUser() {
  return DEV_USER;
}
