import SwiftUI
import ExpoModulesCore

// MARK: - GlassButton (iOS 26+ системный .buttonStyle(.glass))

@available(iOS 26.0, *)
struct GlassButtonView: View {
    let label: String
    let icon: String?
    let tint: Color
    let onPress: () -> Void

    var body: some View {
        Button(action: onPress) {
            if let icon {
                Label(label, systemImage: icon)
            } else {
                Text(label)
            }
        }
        .buttonStyle(.glass)
        .tint(tint)
    }
}

// MARK: - GlassCard

@available(iOS 26.0, *)
struct GlassCardView: View {
    let cornerRadius: CGFloat
    let tint: Color

    var body: some View {
        Color.clear
            .glassEffect(.regular.tint(tint), in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
}

// MARK: - GlassSheet (bottom sheet / modal)

@available(iOS 26.0, *)
struct GlassSheetView: View {
    let topCornerRadius: CGFloat
    let tint: Color

    var body: some View {
        let shape = UnevenRoundedRectangle(
            topLeadingRadius: topCornerRadius,
            bottomLeadingRadius: 0,
            bottomTrailingRadius: 0,
            topTrailingRadius: topCornerRadius,
            style: .continuous
        )
        Color.clear
            .glassEffect(.regular.tint(tint), in: shape)
    }
}

// MARK: - GlassSegmentedPicker
// GlassEffectContainer — элементы физически сливаются когда перекрываются

@available(iOS 26.0, *)
struct GlassSegmentedPickerView: View {
    @ObservedObject var state: GlassPickerState
    let onSelect: (String) -> Void

    var body: some View {
        GlassEffectContainer {
            HStack(spacing: 4) {
                ForEach(state.items, id: \.id) { item in
                    let isSelected = state.selectedId == item.id
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            onSelect(item.id)
                        }
                    } label: {
                        Text(item.label)
                            .font(.system(size: 13, weight: isSelected ? .semibold : .regular, design: .rounded))
                            .foregroundStyle(isSelected ? state.tint : Color(.label).opacity(0.5))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .glassEffect(
                                isSelected
                                    ? .regular.tint(state.tint.opacity(0.2)).interactive()
                                    : .regular.interactive(),
                                in: Capsule()
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(4)
            .glassEffect(.regular, in: Capsule())
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: state.selectedId)
    }
}

// MARK: - GlassHeader

@available(iOS 26.0, *)
struct GlassHeaderView: View {
    let title: String
    let tint: Color
    let showBack: Bool
    let onBack: (() -> Void)?

    var body: some View {
        ZStack {
            Color.clear
                .glassEffect(.regular, in: Rectangle())
                .ignoresSafeArea(edges: .top)

            HStack {
                if showBack, let onBack {
                    Button(action: onBack) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(tint)
                            .padding(10)
                            .glassEffect(.regular.interactive(), in: Circle())
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
                Text(title)
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                    .foregroundStyle(.primary)
                Spacer()
                if showBack {
                    Color.clear.frame(width: 44, height: 44)
                }
            }
            .padding(.horizontal, 16)
        }
    }
}

// MARK: - Color hex helper

extension Color {
    init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s = s.hasPrefix("#") ? String(s.dropFirst()) : s
        guard s.count == 6, let val = UInt64(s, radix: 16) else { return nil }
        self.init(
            red:   Double((val >> 16) & 0xFF) / 255,
            green: Double((val >> 8)  & 0xFF) / 255,
            blue:  Double( val        & 0xFF) / 255
        )
    }
}

// MARK: - State models

struct PickerItem: Identifiable {
    let id: String
    let label: String
}

class GlassPickerState: ObservableObject {
    @Published var selectedId: String = ""
    @Published var items: [PickerItem] = []
    @Published var tint: Color = Color(red: 1.0, green: 0.84, blue: 0.0)
}
