import UIKit
import ExpoModulesCore

// MARK: - Tab Item Model
struct TabItem {
    let id: String
    let label: String
    let icon: String
}

// MARK: - Native UITabBar (iOS 26+ gets Liquid Glass automatically from the system)
class LiquidGlassTabBarViewController: UIViewController, UITabBarDelegate {
    var onTabPress: ((String) -> Void)?

    private let tabBar = UITabBar()
    private var tabIds: [String] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear

        tabBar.delegate = self
        tabBar.isTranslucent = true
        tabBar.backgroundColor = .clear
        tabBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tabBar)

        NSLayoutConstraint.activate([
            tabBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tabBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tabBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    func updateTabs(_ newTabs: [TabItem]) {
        tabIds = newTabs.map { $0.id }
        tabBar.items = newTabs.map { tab in
            UITabBarItem(
                title: tab.label,
                image: UIImage(systemName: tab.icon),
                selectedImage: UIImage(systemName: tab.icon)
            )
        }
    }

    func selectTab(_ tabId: String) {
        guard let index = tabIds.firstIndex(of: tabId),
              let items = tabBar.items,
              index < items.count else { return }
        DispatchQueue.main.async {
            self.tabBar.selectedItem = items[index]
        }
    }

    func setGoldColor(_ hexColor: String) {
        DispatchQueue.main.async {
            self.tabBar.tintColor = UIColor(hex: hexColor)
                ?? UIColor(red: 1.0, green: 0.84, blue: 0.0, alpha: 1.0)
        }
    }

    // MARK: - UITabBarDelegate
    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard let index = tabBar.items?.firstIndex(of: item),
              index < tabIds.count else { return }
        onTabPress?(tabIds[index])
    }
}

// MARK: - UIColor hex helper
extension UIColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s = s.hasPrefix("#") ? String(s.dropFirst()) : s
        guard s.count == 6, let val = UInt64(s, radix: 16) else { return nil }
        self.init(
            red:   CGFloat((val >> 16) & 0xFF) / 255,
            green: CGFloat((val >> 8)  & 0xFF) / 255,
            blue:  CGFloat( val        & 0xFF) / 255,
            alpha: 1.0
        )
    }
}
