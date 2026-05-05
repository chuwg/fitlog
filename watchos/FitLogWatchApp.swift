import SwiftUI

@main
struct FitLogWatchApp: App {
  @StateObject private var session = WatchSessionManager.shared

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(session)
    }
  }
}
