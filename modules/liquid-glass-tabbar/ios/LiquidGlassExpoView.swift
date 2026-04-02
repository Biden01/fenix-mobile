import ExpoModulesCore
import SwiftUI
import UIKit

// MARK: - Module (registers view manager "LiquidGlassView")

public class LiquidGlassViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LiquidGlassView")

        View(LiquidGlassExpoView.self) {
            Prop("cornerRadius") { (view: LiquidGlassExpoView, value: Double) in
                view.cornerRadius = CGFloat(value)
            }
            Prop("tint") { (view: LiquidGlassExpoView, hex: String) in
                view.setTint(hex)
            }
            Prop("interactive") { (view: LiquidGlassExpoView, value: Bool) in
                view.interactive = value
            }
        }
    }
}

// MARK: - ExpoView

class LiquidGlassExpoView: ExpoView {
    var cornerRadius: CGFloat = 16 { didSet { rebuildView() } }
    var glassTintColor: Color = Color.white.opacity(0.05) { didSet { rebuildView() } }
    var interactive: Bool = false { didSet { rebuildView() } }

    private var hosting: UIHostingController<AnyView>?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        backgroundColor = .clear
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard window != nil else { return }
        if hosting == nil { rebuildView() }
        if let hc = hosting, hc.parent == nil, let parentVC = nearestViewController {
            parentVC.addChild(hc)
            hc.didMove(toParent: parentVC)
        }
    }

    func setTint(_ hex: String) {
        glassTintColor = Color(hex: hex) ?? Color.white.opacity(0.05)
    }

    private func rebuildView() {
        let content: AnyView
        if #available(iOS 26.0, *) {
            content = AnyView(
                LiquidGlassSwiftUIView(
                    cornerRadius: cornerRadius,
                    tint: glassTintColor,
                    interactive: interactive
                )
            )
        } else {
            content = AnyView(LiquidGlassFallbackSwiftUIView(cornerRadius: cornerRadius))
        }

        if let hc = hosting {
            hc.rootView = content
            return
        }

        let hc = UIHostingController(rootView: content)
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
        var responder: UIResponder? = next
        while let r = responder {
            if let vc = r as? UIViewController { return vc }
            responder = r.next
        }
        return nil
    }
}
