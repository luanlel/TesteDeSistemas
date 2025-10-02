// testes/test_integracao.test.js
import { setupAdmin } from "../js/setup_admin.js";
import { login } from "../js/auth.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, getDoc, doc } from "firebase/firestore";

// ----- MOCKS DO FIREBASE -----
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

// ----- TESTES -----
describe("🔗 Testes de Integração - Sistema Mercadinho", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Deve criar o admin se ainda não existir", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "admin123" },
    });
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue();

    const result = await setupAdmin();

    expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
    expect(result).toBe("Admin criado com sucesso!");
  });

  test("Deve fazer login de usuário comum e redirecionar para loja", async () => {
    const mockUser = { uid: "user123" };

    // simula login
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    // simula documento encontrado no Firestore (coleção usuarios)
    getDoc.mockImplementation((ref) => {
      if (ref.id === "user123") {
        return Promise.resolve({ exists: () => true, data: () => ({ role: "usuario" }) });
      }
      return Promise.resolve({ exists: () => false });
    });

    // simula localStorage e window.location
    delete global.window;
    global.window = Object.create(window);
    global.window.location = { href: "" };
    global.localStorage = {
      store: {},
      setItem(key, value) {
        this.store[key] = value;
      },
      getItem(key) {
        return this.store[key];
      },
      removeItem(key) {
        delete this.store[key];
      },
    };

    const sucesso = await login("teste@teste.com", "123456");

    expect(sucesso).toBe(true);
    expect(localStorage.getItem("logado")).toBe("usuario");
    expect(window.location.href).toContain("loja.html");
  });

  test("Deve rejeitar login com credenciais inválidas", async () => {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    signInWithEmailAndPassword.mockRejectedValue(new Error("auth/invalid-credentials"));

    const sucesso = await login("teste@teste.com", "senhaerrada");

    expect(sucesso).toBe(false);
  });
});
