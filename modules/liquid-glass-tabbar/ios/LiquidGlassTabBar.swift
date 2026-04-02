import SwiftUI
import ExpoModulesCore

// MARK: - Tab Item Model
struct TabItem: Identifiable {
    let id: String
    let label: String
    let icon: String
}

// MARK: - Reactive state
class TabBarState: ObservableObject {
    @Published var selectedTab: String = ""
    @Published var tabs: [TabItem] = []
    @Published var goldColor: Color = Color(red: 1.0, green: 0.84, blue: 0.0)
}

// MARK: - iOS 26 Floating Liquid Glass Pill (with GlassEffectContainer for lens morphing)
@available(iOS 26.0, *)
struct LiquidGlassTabBarView: View {
    @ObservedObject var state: TabBarState
    let onTabPress: (String) -> Void

    @Namespace private var pillNamespace

    var body: some View {
        GeometryReader { geo in
            VStack(spacing: 0) {
                Spacer()

                // GlassEffectContainer enables physical lens morphing between glass elements
                GlassEffectContainer {
                    HStack(spacing: 0) {
                        ForEach(state.tabs) { tab in
                            let isSelected = state.selectedTab == tab.id

                            Button {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                                    onTabPress(tab.id)
                                }
                            } label: {
                                ZStack {
                                    // Sliding lens indicator — interactive gives the lens distortion on press
                                    if isSelected {
                                        Capsule()
                                            .glassEffect(
                                                .regular
                                                    .tint(state.goldColor.opacity(0.22))
                                                    .interactive()
                                            )
                                            .frame(height: 36)
                                            .matchedGeometryEffect(id: "selection", in: pillNamespace)
                                    }

                                    VStack(spacing: 3) {
                                        Image(systemName: tab.icon)
                                            .font(.system(
                                                size: 18,
                                                weight: isSelected ? .semibold : .regular
                                            ))
                                            .symbolEffect(.bounce, value: isSelected)
                                            .foregroundStyle(
                                                isSelected
                                                    ? state.goldColor
                                                    : Color(.label).opacity(0.45)
                                            )

                                        Text(tab.label)
                                            .font(.system(
                                                size: 9,
                                                weight: isSelected ? .semibold : .regular,
                                                design: .rounded
                                            ))
                                            .foregroundStyle(
                                                isSelected
                                                    ? state.goldColor
                                                    : Color(.label).opacity(0.45)
                                            )
                                    }
                                    .frame(height: 36)
                                }
                                .frame(maxWidth: .infinity)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .glassEffect(.regular, in: Capsule())
                }
                .shadow(color: .black.opacity(0.18), radius: 22, x: 0, y: 8)
                .padding(.horizontal, 28)
                .animation(
                    .spring(response: 0.35, dampingFraction: 0.75),
                    value: state.selectedTab
                )

                Spacer().frame(height: geo.safeAreaInsets.bottom + 10)
            }
        }
        .ignoresSafeArea(edges: .bottom)
    }
}

// MARK: - iOS 17–25 Fallback (same pill shape, ultraThinMaterial)
struct FallbackTabBarView: View {
    @ObservedObject var state: TabBarState
    let onTabPress: (String) -> Void

    @Namespace private var pillNamespace

    var body: some View {
        GeometryReader { geo in
            VStack(spacing: 0) {
                Spacer()

                HStack(spacing: 0) {
                    ForEach(state.tabs) { tab in
                        let isSelected = state.selectedTab == tab.id

                        Button {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                                onTabPress(tab.id)
                            }
                        } label: {
                            ZStack {
                                if isSelected {
                                    Capsule()
                                        .fill(state.goldColor.opacity(0.18))
                                        .frame(height: 36)
                                        .matchedGeometryEffect(id: "selection", in: pillNamespace)
                                }

                                VStack(spacing: 3) {
                                    Image(systemName: tab.icon)
                                        .font(.system(
                                            size: 18,
                                            weight: isSelected ? .semibold : .regular
                                        ))
                                        .foregroundStyle(
                                            isSelected
                                                ? state.goldColor
                                                : Color(.label).opacity(0.45)
                                        )

                                    Text(tab.label)
                                        .font(.system(
                                            size: 9,
                                            weight: isSelected ? .semibold : .regular,
                                            design: .rounded
                                        ))
                                        .foregroundStyle(
                                            isSelected
                                                ? state.goldColor
                                                : Color(.label).opacity(0.45)
                                        )
                                }
                                .frame(height: 36)
                            }
                            .frame(maxWidth: .infinity)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(
                    Capsule()
                        .fill(.ultraThinMaterial)
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
                        )
                )
                .shadow(color: .black.opacity(0.15), radius: 20, x: 0, y: 8)
                .padding(.horizontal, 28)
                .animation(
                    .spring(response: 0.35, dampingFraction: 0.75),
                    value: state.selectedTab
                )

                Spacer().frame(height: geo.safeAreaInsets.bottom + 10)
            }
        }
        .ignoresSafeArea(edges: .bottom)
    }
}

// MARK: - UIKit host
class LiquidGlassTabBarViewController: UIViewController {
    var onTabPress: ((String) -> Void)?
    let tabBarState = TabBarState()

    private var hostingController: UIViewController?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        embedTabBar()
    }

    private func embedTabBar() {
        let tabBarView: AnyView

        if #available(iOS 26.0, *) {
            tabBarView = AnyView(
                LiquidGlassTabBarView(state: tabBarState) { [weak self] tabId in
                    self?.onTabPress?(tabId)
                }
            )
        } else {
            tabBarView = AnyView(
                FallbackTabBarView(state: tabBarState) { [weak self] tabId in
                    self?.onTabPress?(tabId)
                }
            )
        }

        let hosting = UIHostingController(rootView: tabBarView)
        hosting.view.backgroundColor = .clear
        hosting.view.isOpaque = false
        hosting.view.translatesAutoresizingMaskIntoConstraints = false

        addChild(hosting)
        view.addSubview(hosting.view)

        NSLayoutConstraint.activate([
            hosting.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hosting.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hosting.view.topAnchor.constraint(equalTo: view.topAnchor),
            hosting.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        hosting.didMove(toParent: self)
        hostingController = hosting
    }

    func updateTabs(_ newTabs: [TabItem]) {
        DispatchQueue.main.async { self.tabBarState.tabs = newTabs }
    }

    func selectTab(_ tabId: String) {
        DispatchQueue.main.async {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                self.tabBarState.selectedTab = tabId
            }
        }
    }

    func setGoldColor(_ hexColor: String) {
        DispatchQueue.main.async {
            self.tabBarState.goldColor = Color(hex: hexColor)
                ?? Color(red: 1.0, green: 0.84, blue: 0.0)
        }
    }
}

// MARK: - Hex color helper
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
