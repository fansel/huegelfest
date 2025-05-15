export interface PacklistItem {
  id: string;
  text: string;
  checked: boolean;
  /**
   * Markiert, ob das Item lokal ausgeblendet ("gelöscht") wurde.
   * Wird nur im LocalStorage verwendet, nicht in der globalen DB.
   */
  deleted?: boolean;
} 