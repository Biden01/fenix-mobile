import SwiftUI

// MARK: - iOS 26+ Liquid Glass surface

@available(iOS 26.0, *)
struct LiquidGlassSwiftUIView: View {
    let cornerRadius: CGFloat
    let tint: Color
    let interactive: Bool

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .glassEffect(
                interactive
                    ? .regular.tint(tint).interactive()
                    : .regular.tint(tint),
                in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - iOS 17–25 Fallback (ultraThinMaterial + subtle border)

struct LiquidGlassFallbackSwiftUIView: View {
    let cornerRadius: CGFloat

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(.ultraThinMaterial)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
