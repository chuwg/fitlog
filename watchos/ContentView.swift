import SwiftUI

struct ContentView: View {
  @EnvironmentObject var session: WatchSessionManager

  var body: some View {
    ScrollView {
      VStack(spacing: 10) {
        Text("훈련 준비")
          .font(.caption2)
          .foregroundStyle(.secondary)
          .textCase(.uppercase)
          .tracking(1)

        if let score = session.score {
          Text("\(score)")
            .font(.system(size: 64, weight: .heavy, design: .rounded))
            .foregroundStyle(scoreColor(score))
            .minimumScaleFactor(0.5)
            .lineLimit(1)
        } else {
          Text("--")
            .font(.system(size: 44, weight: .heavy))
            .foregroundStyle(.secondary)
        }

        Text(session.status)
          .font(.headline)
          .foregroundStyle(.primary)

        Text(session.advice)
          .font(.caption2)
          .multilineTextAlignment(.center)
          .foregroundStyle(.secondary)
          .padding(.horizontal, 4)

        if let sleep = session.sleepHours {
          HStack(spacing: 4) {
            Text("🌙")
            Text(String(format: "%.1f시간", sleep))
              .font(.caption2)
              .foregroundStyle(.secondary)
          }
          .padding(.top, 4)
        }

        if let updated = session.updatedAt {
          Text(updateLabel(updated))
            .font(.caption2)
            .foregroundStyle(.tertiary)
            .padding(.top, 6)
        }
      }
      .padding(.vertical, 8)
    }
  }

  private func scoreColor(_ score: Int) -> Color {
    if score >= 80 { return Color(red: 0/255, green: 212/255, blue: 170/255) }
    if score >= 60 { return Color(red: 245/255, green: 196/255, blue: 81/255) }
    if score >= 40 { return Color(red: 255/255, green: 159/255, blue: 67/255) }
    return Color(red: 255/255, green: 92/255, blue: 107/255)
  }

  private func updateLabel(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "ko_KR")
    f.dateFormat = "M월 d일 HH:mm"
    return "갱신 " + f.string(from: date)
  }
}

#Preview {
  ContentView()
    .environmentObject(WatchSessionManager.shared)
}
