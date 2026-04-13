import ExpoModulesCore
import UIKit

public class LiquidGlassTabBarModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LiquidGlassTabBar")

        View(LiquidGlassTabBarExpoView.self) {
            Events("onTabPress")

            Prop("tabs") { (view: LiquidGlassTabBarExpoView, tabs: [[String: String]]) in
                view.updateTabs(tabs)
            }

            Prop("selectedTab") { (view: LiquidGlassTabBarExpoView, tabId: String) in
                view.selectTab(tabId)
            }

            Prop("goldColor") { (view: LiquidGlassTabBarExpoView, color: String) in
                view.setGoldColor(color)
            }
        }
    }
}

class LiquidGlassTabBarExpoView: ExpoView {
    private let tabBarVC = LiquidGlassTabBarViewController()
    let onTabPress = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupView()
    }

    private func setupView() {
        backgroundColor = .clear

        tabBarVC.onTabPress = { [weak self] tabId in
            self?.onTabPress(["tabId": tabId])
        }

        tabBarVC.view.translatesAutoresizingMaskIntoConstraints = false
        addSubview(tabBarVC.view)

        NSLayoutConstraint.activate([
            tabBarVC.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            tabBarVC.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            tabBarVC.view.topAnchor.constraint(equalTo: topAnchor),
            tabBarVC.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    // Must call viewDidLoad manually since we're not presenting the VC
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if tabBarVC.view.window != nil && tabBarVC.parent == nil {
            // Find nearest ancestor view controller via responder chain
            // (avoids UIViewControllerHierarchyInconsistency with RNSScreen)
            if let parentVC = nearestViewController {
                parentVC.addChild(tabBarVC)
                tabBarVC.didMove(toParent: parentVC)
            }
        }
    }

    private var nearestViewController: UIViewController? {
        var responder: UIResponder? = self.next
        while let r = responder {
            if let vc = r as? UIViewController {
                return vc
            }
            responder = r.next
        }
        return nil
    }

    func updateTabs(_ tabsData: [[String: String]]) {
        let tabs = tabsData.compactMap { dict -> TabItem? in
            guard let id = dict["id"],
                  let label = dict["label"],
                  let icon = dict["icon"] else { return nil }
            return TabItem(id: id, label: label, icon: icon)
        }
        tabBarVC.updateTabs(tabs)
    }

    func selectTab(_ tabId: String) {
        DispatchQueue.main.async { self.tabBarVC.selectTab(tabId) }
    }

    func setGoldColor(_ color: String) {
        tabBarVC.setGoldColor(color)
    }
}
