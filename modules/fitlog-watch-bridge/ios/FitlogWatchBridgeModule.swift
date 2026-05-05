import ExpoModulesCore
import WatchConnectivity

public class FitlogWatchBridgeModule: Module {
  private let delegate = WatchSessionDelegate()

  public func definition() -> ModuleDefinition {
    Name("FitlogWatchBridge")

    OnCreate {
      if WCSession.isSupported() {
        let session = WCSession.default
        session.delegate = self.delegate
        session.activate()
      }
    }

    AsyncFunction("sendUpdate") { (data: [String: Any], promise: Promise) in
      guard WCSession.isSupported() else {
        promise.reject("E_UNSUPPORTED", "WatchConnectivity not supported")
        return
      }
      let session = WCSession.default
      guard session.isReachable else {
        promise.reject("E_UNREACHABLE", "Apple Watch is not reachable")
        return
      }
      session.sendMessage(data, replyHandler: { reply in
        promise.resolve(reply)
      }, errorHandler: { error in
        promise.reject("E_SEND", error.localizedDescription)
      })
    }

    AsyncFunction("updateApplicationContext") { (data: [String: Any], promise: Promise) in
      guard WCSession.isSupported() else {
        promise.resolve(false)
        return
      }
      do {
        try WCSession.default.updateApplicationContext(data)
        promise.resolve(true)
      } catch {
        promise.reject("E_CONTEXT", error.localizedDescription)
      }
    }

    Function("isReachable") { () -> Bool in
      guard WCSession.isSupported() else { return false }
      return WCSession.default.isReachable
    }

    Function("isPaired") { () -> Bool in
      guard WCSession.isSupported() else { return false }
      return WCSession.default.isPaired
    }

    Function("isWatchAppInstalled") { () -> Bool in
      guard WCSession.isSupported() else { return false }
      return WCSession.default.isWatchAppInstalled
    }
  }
}

private class WatchSessionDelegate: NSObject, WCSessionDelegate {
  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {}

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }
}
