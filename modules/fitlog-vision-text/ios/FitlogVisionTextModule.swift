import ExpoModulesCore
import Vision
import UIKit

public class FitlogVisionTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FitlogVisionText")

    AsyncFunction("recognizeText") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri) else {
        promise.reject("E_URI", "Invalid URI: \(uri)")
        return
      }

      do {
        let data = try Data(contentsOf: url)
        guard let image = UIImage(data: data), let cgImage = image.cgImage else {
          promise.reject("E_IMAGE", "Failed to decode image")
          return
        }

        let request = VNRecognizeTextRequest { request, error in
          if let error = error {
            promise.reject("E_OCR", error.localizedDescription)
            return
          }
          let observations = request.results as? [VNRecognizedTextObservation] ?? []
          let lines = observations.compactMap { $0.topCandidates(1).first?.string }
          promise.resolve(lines.joined(separator: "\n"))
        }
        request.recognitionLanguages = ["ko-KR", "en-US"]
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        DispatchQueue.global(qos: .userInitiated).async {
          do {
            try handler.perform([request])
          } catch {
            promise.reject("E_OCR", error.localizedDescription)
          }
        }
      } catch {
        promise.reject("E_READ", error.localizedDescription)
      }
    }
  }
}
