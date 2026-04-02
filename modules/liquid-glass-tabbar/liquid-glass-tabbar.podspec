require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'liquid-glass-tabbar'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = 'MIT'
  s.author         = 'FenixApp'
  s.homepage       = 'https://expo.dev'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :path => '.' }
  s.source_files   = 'ios/**/*.swift'
  s.dependency 'ExpoModulesCore'
  s.swift_version  = '5.9'
end
