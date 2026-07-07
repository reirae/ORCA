import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  registerConsultThreadSocketHandlers,
  handlePeerConnectionStateChange,
  normPoint,
  isActiveCallState,
  ACTIVE_CALL_STATES,
} from "../../components/consultThreadSocket";

function createSocket() {
  const handlers = new Map();
  return {
    on: vi.fn((event, fn) => {
      handlers.set(event, fn);
    }),
    emit: vi.fn(),
    trigger(event, payload) {
      handlers.get(event)?.(payload);
    },
  };
}

function createHandlers(overrides = {}) {
  return {
    convId: 1,
    userId: 10,
    isCancelled: () => false,
    setStatus: vi.fn(),
    setMessages: vi.fn(),
    appendMessage: vi.fn(),
    onAnnotation: vi.fn(),
    setThreadError: vi.fn(),
    setCounterpartOnline: vi.fn(),
    setRemoteUserName: vi.fn(),
    setCallNotice: vi.fn(),
    getCallStatus: vi.fn(() => "idle"),
    getCallRole: vi.fn(() => null),
    isAccepted: vi.fn(() => false),
    onIncomingRing: vi.fn(),
    onCallerAccepted: vi.fn(),
    onCallerDeclined: vi.fn(),
    onCallerCancelled: vi.fn(),
    onRemoteOffer: vi.fn(),
    onRemoteAnswer: vi.fn(),
    onRemoteCandidate: vi.fn(),
    onRemoteAnnotation: vi.fn(),
    onRemoteAnnotationClear: vi.fn(),
    onCallEnded: vi.fn(),
    onUserLeft: vi.fn(),
    onCallError: vi.fn(),
    ...overrides,
  };
}

describe("consultThreadSocket", () => {
  let socket;
  let h;

  beforeEach(() => {
    socket = createSocket();
    h = createHandlers();
    registerConsultThreadSocketHandlers(socket, h);
  });

  test("connect joins chat and call rooms when active", () => {
    socket.trigger("connect");

    expect(h.setStatus).toHaveBeenCalledWith("connected");
    expect(socket.emit).toHaveBeenCalledWith("chat:join", { conversationId: 1 });
    expect(socket.emit).toHaveBeenCalledWith("call:join", { conversationId: 1 });
  });

  test("connect_error surfaces the socket error message", () => {
    socket.trigger("connect_error", { message: "auth failed" });
    expect(h.setStatus).toHaveBeenCalledWith("error: auth failed");
  });

  test("chat:history replaces the message list", () => {
    const history = [{ id: 1, content: "old" }];
    socket.trigger("chat:history", { messages: history });
    expect(h.setMessages).toHaveBeenCalledWith(history);
  });

  test("chat:message, chat:file, and chat:voice append messages", () => {
    const text = { id: 1, type: "text" };
    const file = { id: 2, type: "file" };
    const voice = { id: 3, type: "voice" };

    socket.trigger("chat:message", text);
    socket.trigger("chat:file", file);
    socket.trigger("chat:voice", voice);

    expect(h.appendMessage).toHaveBeenCalledWith(text);
    expect(h.appendMessage).toHaveBeenCalledWith(file);
    expect(h.appendMessage).toHaveBeenCalledWith(voice);
  });

  test("chat:annotation forwards overlay updates", () => {
    const annotation = { file_id: 5, version: 2 };
    socket.trigger("chat:annotation", annotation);
    expect(h.onAnnotation).toHaveBeenCalledWith(annotation);
  });

  test("chat:error sets thread error text", () => {
    socket.trigger("chat:error", { message: "upload failed" });
    expect(h.setThreadError).toHaveBeenCalledWith("upload failed");
  });

  test("call:user-joined marks counterpart online unless it is the current user", () => {
    socket.trigger("call:user-joined", { name: "Expert", userId: 99 });
    expect(h.setCounterpartOnline).toHaveBeenCalledWith(true);
    expect(h.setRemoteUserName).toHaveBeenCalledWith("Expert");
    expect(h.setCallNotice).toHaveBeenCalledWith(null);

    h.setCounterpartOnline.mockClear();
    socket.trigger("call:user-joined", { name: "Me", userId: 10 });
    expect(h.setCounterpartOnline).not.toHaveBeenCalled();
  });

  test("call:ring auto-declines when not idle", () => {
    h.getCallStatus.mockReturnValue("in-call");
    socket.trigger("call:ring", { name: "Expert" });

    expect(socket.emit).toHaveBeenCalledWith("call:decline", { conversationId: 1 });
    expect(h.onIncomingRing).not.toHaveBeenCalled();
  });

  test("call:ring shows incoming prompt when idle", () => {
    socket.trigger("call:ring", { name: "Expert" });
    expect(h.onIncomingRing).toHaveBeenCalledWith("Expert");
  });

  test("call:accept only runs for the caller role", () => {
    h.getCallRole.mockReturnValue("caller");
    socket.trigger("call:accept");
    expect(h.onCallerAccepted).toHaveBeenCalled();

    h.onCallerAccepted.mockClear();
    h.getCallRole.mockReturnValue("callee");
    socket.trigger("call:accept");
    expect(h.onCallerAccepted).not.toHaveBeenCalled();
  });

  test("call:decline only runs for the caller role", () => {
    h.getCallRole.mockReturnValue("caller");
    socket.trigger("call:decline");
    expect(h.onCallerDeclined).toHaveBeenCalled();
  });

  test("call:cancel only runs while incoming", () => {
    h.getCallStatus.mockReturnValue("incoming");
    socket.trigger("call:cancel");
    expect(h.onCallerCancelled).toHaveBeenCalled();

    h.onCallerCancelled.mockClear();
    h.getCallStatus.mockReturnValue("idle");
    socket.trigger("call:cancel");
    expect(h.onCallerCancelled).not.toHaveBeenCalled();
  });

  test("call:offer requires accepted callee role", () => {
    h.getCallRole.mockReturnValue("callee");
    h.isAccepted.mockReturnValue(true);
    const offer = { type: "offer", sdp: "v=0" };
    socket.trigger("call:offer", { offer });
    expect(h.onRemoteOffer).toHaveBeenCalledWith(offer);

    h.onRemoteOffer.mockClear();
    h.isAccepted.mockReturnValue(false);
    socket.trigger("call:offer", { offer });
    expect(h.onRemoteOffer).not.toHaveBeenCalled();
  });

  test("call:answer and call:ice-candidate forward signalling payloads", () => {
    const answer = { type: "answer" };
    const candidate = { candidate: "abc" };
    socket.trigger("call:answer", { answer });
    socket.trigger("call:ice-candidate", { candidate });
    expect(h.onRemoteAnswer).toHaveBeenCalledWith(answer);
    expect(h.onRemoteCandidate).toHaveBeenCalledWith(candidate);
  });

  test("call:annotation ignores invalid strokes", () => {
    socket.trigger("call:annotation", { stroke: { points: "bad" } });
    expect(h.onRemoteAnnotation).not.toHaveBeenCalled();

    const stroke = { points: [[0, 0], [1, 1]] };
    socket.trigger("call:annotation", { stroke });
    expect(h.onRemoteAnnotation).toHaveBeenCalledWith(stroke);
  });

  test("call lifecycle events delegate to handlers", () => {
    socket.trigger("call:annotation-clear");
    socket.trigger("call:ended");
    socket.trigger("call:user-left", { userId: 99 });
    socket.trigger("call:error", { message: "TURN failed" });
    socket.trigger("disconnect");

    expect(h.onRemoteAnnotationClear).toHaveBeenCalled();
    expect(h.onCallEnded).toHaveBeenCalledWith("Call ended — text chat remains available.");
    expect(h.onUserLeft).toHaveBeenCalledWith(99);
    expect(h.onCallError).toHaveBeenCalledWith("TURN failed");
    expect(h.setStatus).toHaveBeenCalledWith("disconnected");
  });

  test("registerConsultThreadSocketHandlers ignores events when cancelled", () => {
    const cancelledSocket = createSocket();
    const cancelledHandlers = createHandlers({ isCancelled: () => true });
    registerConsultThreadSocketHandlers(cancelledSocket, cancelledHandlers);
    cancelledSocket.trigger("chat:message", { id: 1 });
    expect(cancelledHandlers.appendMessage).not.toHaveBeenCalled();
  });

  test("normPoint normalizes pointer coordinates to 0..1", () => {
    const target = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100 }),
    };
    const point = normPoint({ currentTarget: target, clientX: 100, clientY: 50 });
    expect(point).toEqual({ x: 0.5, y: 0.5 });
  });

  test("normPoint clamps coordinates inside the overlay bounds", () => {
    const target = {
      getBoundingClientRect: () => ({ left: 10, top: 10, width: 100, height: 100 }),
    };
    const point = normPoint({ currentTarget: target, clientX: 500, clientY: -5 });
    expect(point).toEqual({ x: 1, y: 0 });
  });

  test("isActiveCallState reflects ACTIVE_CALL_STATES set", () => {
    expect(isActiveCallState("in-call")).toBe(true);
    expect(isActiveCallState("idle")).toBe(false);
    expect(ACTIVE_CALL_STATES.has("ringing")).toBe(true);
  });

  test("handlePeerConnectionStateChange maps connection states to callbacks", () => {
    const callbacks = { onConnected: vi.fn(), onUnstable: vi.fn(), onEnded: vi.fn() };

    handlePeerConnectionStateChange({ connectionState: "connected" }, {}, callbacks);
    expect(callbacks.onConnected).toHaveBeenCalled();

    callbacks.onConnected.mockClear();
    handlePeerConnectionStateChange({ connectionState: "disconnected" }, {}, callbacks);
    expect(callbacks.onUnstable).toHaveBeenCalled();

    callbacks.onUnstable.mockClear();
    const pc = { connectionState: "failed" };
    handlePeerConnectionStateChange(pc, pc, callbacks);
    expect(callbacks.onEnded).toHaveBeenCalled();
  });
});
