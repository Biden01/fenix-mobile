import ExpoModulesCore
import SwiftUI
import UIKit

// MARK: - GlassButton

public class GlassButtonModule: Module {
    public func definition() -> ModuleDefinition {
        Name("GlassButton")

        View(GlassButtonExpoView.self) {
            Events("onButtonPress")

            Prop("label") { (view: GlassButtonExpoView, value: String) in
                view.label = value
            }
            Prop("icon") { (view: GlassButtonExpoView, value: String) in
                view.icon = value.isEmpty ? nil : value
            }
            Prop("tint") { (view: GlassButtonExpoView, value: String) in
                view.setTint(value)
            }
        }
    }
}

// .buttonStyle(.glass) — официальный Apple API из документации iOS 26
class GlassButtonExpoView: ExpoView {
    var label: String = "Button" { didSet { rebuild() } }
    var icon: String? { didSet { rebuild() } }
    var glassTint: Color = Color(red: 1.0, green: 0.84, blue: 0.0) { didSet { rebuild() } }
    let onButtonPress = EventDispatcher()

    private var hosting: UIHostingController<AnyView>?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        backgroundColor = .clear
    }

    func setTint(_ hex: String) {
        glassTint = Color(hex: hex) ?? Color(red: 1.0, green: 0.84, blue: 0.0)
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if hosting == nil { rebuild() }
        if let hc = hosting, hc.parent == nil, let parentVC = nearestViewController {
            parentVC.addChild(hc)
            hc.didMove(toParent: parentVC)
        }
    }

    private func rebuild() {
        guard #available(iOS 26.0, *) else { return }
        let handler: () -> Void = { [weak self] in self?.onButtonPress([:]) }
        let view = AnyView(
            GlassButtonView(label: label, icon: icon, tint: glassTint, onPress: handler)
        )
        if let hc = hosting { hc.rootView = view; return }
        let hc = UIHostingController(rootView: view)
        hc.view.backgroundColor = .clear
        hc.view.isOpaque = false
        hc.view.translatesAutoresizingMaskIntoConstraints = false
        insertSubview(hc.view, at: 0)
        NSLayoutConstraint.activate([
            hc.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            hc.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            hc.view.topAnchor.constraint(equalTo: topAnchor),
            hc.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
        hosting = hc
    }

    private var nearestViewController: UIViewController? {
        var r: UIResponder? = next
        while let cur = r { if let vc = cur as? UIViewController { return vc }; r = cur.next }
        return nil
    }
}

// MARK: - GlassCard

public class GlassCardModule: Module {
    public func definition() -> ModuleDefinition {
        Name("GlassCard")

        View(GlassCardExpoView.self) {
            Prop("cornerRadius") { (view: GlassCardExpoView, value: Double) in
                view.cornerRadius = CGFloat(value)
            }
            Prop("tint") { (view: GlassCardExpoView, value: String) in
                view.setTint(value)
            }
        }
    }
}

class GlassCardExpoView: ExpoView {
    var cornerRadius: CGFloat = 20 { didSet { rebuild() } }
    var glassColor: Color = .clear { didSet { rebuild() } }

    private var hosting: UIHostingController<AnyView>?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        backgroundColor = .clear
    }

    func setTint(_ hex: String) {
        glassColor = Color(hex: hex) ?? .clear
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if hosting == nil { rebuild() }
        if let hc = hosting, hc.parent == nil, let parentVC = nearestViewController {
            parentVC.addChild(hc)
            hc.didMove(toParent: parentVC)
        }
    }

    private func rebuild() {
        guard #available(iOS 26.0, *) else { return }
        let view = AnyView(GlassCardView(cornerRadius: cornerRadius, tint: glassColor))
        if let hc = hosting { hc.rootView = view; return }
        embed(view)
    }

    private func embed(_ rootView: AnyView) {
        let hc = UIHostingController(rootView: rootView)
        hc.view.backgroundColor = UIColor.clear
        hc.view.isOpaque = false
        hc.view.translatesAutoresizingMaskIntoConstraints = false
        insertSubview(hc.view, at: 0)
        NSLayoutConstraint.activate([
            hc.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            hc.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            hc.view.topAnchor.constraint(equalTo: topAnchor),
            hc.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
        hosting = hc
    }

    private var nearestViewController: UIViewController? {
        var r: UIResponder? = next
        while let cur = r { if let vc = cur as? UIViewController { return vc }; r = cur.next }
        return nil
    }
}

// MARK: - GlassSegmentedPicker (нативный UISegmentedControl — автоматический Liquid Glass на iOS 26)

public class GlassSegmentedPickerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("GlassSegmentedPicker")

        View(GlassSegmentedPickerExpoView.self) {
            Events("onSelect")

            Prop("items") { (view: GlassSegmentedPickerExpoView, items: [[String: String]]) in
                view.updateItems(items)
            }
            Prop("selectedId") { (view: GlassSegmentedPickerExpoView, value: String) in
                view.selectItem(value)
            }
            Prop("tint") { (view: GlassSegmentedPickerExpoView, value: String) in
                view.setTint(value)
            }
        }
    }
}

class GlassSegmentedPickerExpoView: ExpoView {
    let onSelect = EventDispatcher()
    private let segmented = UISegmentedControl()
    private var itemIds: [String] = []

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        backgroundColor = .clear
        segmented.addTarget(self, action: #selector(valueChanged), for: .valueChanged)
        segmented.translatesAutoresizingMaskIntoConstraints = false
        addSubview(segmented)
        NSLayoutConstraint.activate([
            segmented.leadingAnchor.constraint(equalTo: leadingAnchor),
            segmented.trailingAnchor.constraint(equalTo: trailingAnchor),
            segmented.centerYAnchor.constraint(equalTo: centerYAnchor),
        ])
    }

    func updateItems(_ data: [[String: String]]) {
        segmented.removeAllSegments()
        itemIds = []
        for (index, item) in data.enumerated() {
            guard let id = item["id"], let label = item["label"] else { continue }
            itemIds.append(id)
            segmented.insertSegment(withTitle: label, at: index, animated: false)
        }
    }

    func selectItem(_ id: String) {
        guard let index = itemIds.firstIndex(of: id) else { return }
        DispatchQueue.main.async { self.segmented.selectedSegmentIndex = index }
    }

    func setTint(_ hex: String) {
        segmented.selectedSegmentTintColor = UIColor(hex: hex)
            ?? UIColor(red: 1.0, green: 0.84, blue: 0.0, alpha: 1.0)
    }

    @objc private func valueChanged() {
        let index = segmented.selectedSegmentIndex
        guard index >= 0, index < itemIds.count else { return }
        onSelect(["id": itemIds[index]])
    }
}
