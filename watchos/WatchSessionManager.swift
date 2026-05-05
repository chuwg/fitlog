import Foundation
import WatchConnectivity

final class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate {
  static let shared = WatchSessionManager()

  @Published var score: Int? = nil
  @Published var status: String = "—"
  @Published var advice: String = "iPhone 앱이 열리면 데이터를 받아옵니다"
  @Published var sleepHours: Double? = nil
  @Published var updatedAt: Date? = nil
  @Published var isReachable: Bool = false

  override init() {
    super.init()
    if WCSession.isSupported() {
      let session = WCSession.default
      session.delegate = self
      session.activate()
    }
  }

  // MARK: - WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    DispatchQueue.main.async {
      self.isReachable = session.isReachable
      self.applyData(session.receivedApplicationContext)
    }
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    DispatchQueue.main.async {
      self.isReachable = session.isReachable
    }
  }

  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    DispatchQueue.main.async {
      self.applyData(message)
      replyHandler(["received": true])
    }
  }

  func session(
    _ session: WCSession,
    didReceiveApplicationContext applicationContext: [String: Any]
  ) {
    DispatchQueue.main.async {
      self.applyData(applicationContext)
    }
  }

  // MARK: - Private

  private func applyData(_ data: [String: Any]) {
    if let v = data["score"] as? Int { self.score = v }
    if let v = data["status"] as? String { self.status = v }
    if let v = data["advice"] as? String { self.advice = v }
    if let v = data["sleepHours"] as? Double { self.sleepHours = v }
    self.updatedAt = Date()
  }
}
